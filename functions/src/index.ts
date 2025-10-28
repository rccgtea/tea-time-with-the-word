import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Read API key from environment variable first, then fall back to functions config
const GENAI_API_KEY = process.env.GENAI_KEY || functions.config().genai?.key;
const GENAI_MODEL = process.env.GENAI_MODEL || 'gemini-2.5-flash';
const GENAI_VOICE_MODEL = process.env.GENAI_VOICE_MODEL || 'gemini-2.0-flash';
const SCRIPTURE_TZ = process.env.SCRIPTURE_TIMEZONE || 'America/Denver';
if (!GENAI_API_KEY) {
  console.warn('GenAI API key not configured. Set it as GENAI_KEY env var or with `firebase functions:config:set genai.key="YOUR_KEY"`');
}

const getLocalDateInfo = () => {
  try {
    const dateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: SCRIPTURE_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());
    const [yearStr, monthStr, dayStr] = dateStr.split('-');
    return {
      dateStr,
      year: Number(yearStr),
      month: Number(monthStr),
      day: Number(dayStr),
    };
  } catch {
    const fallback = new Date();
    return {
      dateStr: fallback.toISOString().slice(0, 10),
      year: fallback.getUTCFullYear(),
      month: fallback.getUTCMonth() + 1,
      day: fallback.getUTCDate(),
    };
  }
};

async function callGenAI(prompt: string) {
  if (!GENAI_API_KEY) throw new Error('GenAI API key not configured');

  // Use Google Generative Language REST endpoint (Gemini generateContent)
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(GENAI_MODEL)}:generateContent?key=${encodeURIComponent(GENAI_API_KEY)}`;

  const body = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
    },
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text();
    throw new Error(`GenAI HTTP error ${resp.status}: ${txt}`);
  }

  const json: any = await resp.json();
  // Gemini responses keep text inside candidates[].content.parts[].text
  const text =
    json?.candidates?.[0]?.content?.parts
      ?.map((part: any) => part?.text || '')
      .join('')
      .trim() || '';
  return text;
}

async function synthesizeVoice(text: string) {
  if (!text) return null;
  try {
    // Use Application Default Credentials (service account)
    // No API key needed - uses Cloud Function's built-in service account
    const projectId = process.env.GCLOUD_PROJECT || 'tea-time-with-the-word';
    const url = `https://texttospeech.googleapis.com/v1/text:synthesize`;
    
    // Get access token from metadata server
    const tokenResp = await fetch(
      'http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token',
      { headers: { 'Metadata-Flavor': 'Google' } }
    );
    const tokenData: any = await tokenResp.json();
    const accessToken = tokenData.access_token;
    
    const body = {
      input: { text },
      voice: {
        languageCode: 'en-US',
        name: 'en-US-Neural2-F', // High-quality Neural2 voice (natural female)
        ssmlGender: 'FEMALE',
      },
      audioConfig: {
        audioEncoding: 'MP3',
        pitch: 0,
        speakingRate: 0.92,
        effectsProfileId: ['small-bluetooth-speaker-class-device'],
      },
    };
    
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'x-goog-user-project': projectId,
      },
      body: JSON.stringify(body),
    });
    
    if (!resp.ok) {
      const txt = await resp.text();
      console.error(`TTS API error ${resp.status}:`, txt);
      throw new Error(`Voice synthesis HTTP error ${resp.status}: ${txt}`);
    }
    const json: any = await resp.json();
    return json?.audioContent || null;
  } catch (err) {
    console.error('Voice synthesis error:', err);
    return null;
  }
}

async function generateScriptureFor(theme: string, day: number, year: number, month: number) {
  // Fetch all scriptures already generated this month to prevent duplicates
  const docRef = db.collection('meta').doc('dailyScripture');
  const snap = await docRef.get();
  const existingScriptures: string[] = [];
  
  if (snap.exists) {
    const data = snap.data() as Record<string, any>;
    // Get all scriptures from the current month (format: YYYY-MM-DD)
    const monthPrefix = `${year}-${String(month).padStart(2, '0')}`;
    Object.keys(data).forEach(dateKey => {
      if (dateKey.startsWith(monthPrefix) && data[dateKey]?.reference) {
        existingScriptures.push(data[dateKey].reference);
      }
    });
  }

  // Build prompt with list of already-used scriptures to avoid duplicates
  let prompt = `You are a biblical assistant for the 'RCCG the Eagles Ark' church. The theme for this month is "${theme}". 

CRITICAL REQUIREMENTS:
1. The scripture MUST be highly relevant to the monthly theme: "${theme}"
2. The scripture should provide spiritual insight, encouragement, or teaching related to this theme
3. Choose a powerful, meaningful verse that speaks directly to "${theme}"
4. Provide a single bible scripture for day ${day} of the month.`;
  
  if (existingScriptures.length > 0) {
    prompt += `\n\nIMPORTANT: The following scriptures have ALREADY been used this month. You MUST choose a DIFFERENT scripture that is still relevant to the theme "${theme}":\n${existingScriptures.join(', ')}`;
  }
  
  prompt += `\n\nThe scripture you choose must clearly relate to the theme "${theme}". 

Return ONLY a JSON object with the following fields:
- 'reference': the main verse (e.g., "John 3:16")
- 'versions': object with the main verse in KJV, NKJV, NIV, MSG, NLT, AMP
- 'expandedReference': the expanded range including 2-3 verses before and after for context (e.g., "John 3:14-18")
- 'expandedVersions': object with the expanded passage in KJV, NKJV, NIV, MSG, NLT, AMP

This allows readers to see the main verse first, then click "Read More" to see the surrounding context.`;

  const text = await callGenAI(prompt);
  if (!text) throw new Error('Empty response from GenAI');

  const cleaned = text
    .trim()
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.reference || !parsed.versions) throw new Error('Invalid scripture JSON');
  
  // Expanded fields are optional but recommended
  if (!parsed.expandedReference || !parsed.expandedVersions) {
    console.warn('Scripture generated without expanded context. This is acceptable but not ideal.');
  }
  
  // Verify the generated scripture is not a duplicate
  if (existingScriptures.includes(parsed.reference)) {
    console.warn(`Generated duplicate scripture: ${parsed.reference}. Retrying...`);
    throw new Error('Generated duplicate scripture - AI ignored instructions');
  }
  
  return parsed;
}

// HTTPS endpoint that returns today's scripture (reads Firestore or generates on-demand)
export const getTodaysScripture = functions.https.onRequest(async (req, res) => {
  try {
    const { dateStr: todayStr, year, month, day } = getLocalDateInfo();
    const docRef = db.collection('meta').doc('dailyScripture');
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as Record<string, any>;
      if (data && data[todayStr]) {
        res.json(data[todayStr]);
        return;
      }
    }

    // If not present, generate on-demand (safe fallback). Read current theme.
    const themeDoc = await db.collection('meta').doc('themes').get();
    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
    const currentTheme = (themeDoc.data() || {})[monthKey] || 'Encouragement';
    const scripture = await generateScriptureFor(currentTheme, day, year, month);

    // Save under today key
    await docRef.set({ [todayStr]: scripture }, { merge: true });
    res.json(scripture);
  } catch (err) {
    console.error('Error in getTodaysScripture:', err);
    res.status(500).json({ error: 'Failed to get today\'s scripture' });
  }
});

// Scheduled function runs daily at midnight in specified timezone and writes scripture to Firestore
export const scheduledDailyScripture = functions.pubsub
  .schedule('0 0 * * *') // midnight
  .timeZone(SCRIPTURE_TZ)
  .onRun(async (context) => {
    try {
      const { dateStr: todayStr, year, month, day } = getLocalDateInfo();
      const themeDoc = await db.collection('meta').doc('themes').get();
      const monthKey = `${year}-${String(month).padStart(2, '0')}`;
      const currentTheme = (themeDoc.data() || {})[monthKey] || 'Encouragement';
      const scripture = await generateScriptureFor(currentTheme, day, year, month);
      const docRef = db.collection('meta').doc('dailyScripture');
      await docRef.set({ [todayStr]: scripture }, { merge: true });
      console.log('Daily scripture generated for', todayStr);
    } catch (err) {
      console.error('Error generating daily scripture:', err);
    }
  });

// HTTPS chat endpoint: receives { theme, scripture, message }
export const chat = functions.https.onRequest(async (req, res) => {
  try {
    if (req.method !== 'POST') {
      res.status(405).send({ error: 'Method not allowed' });
      return;
    }

    const { theme, scripture, message } = req.body || {};
    if (!message) {
      res.status(400).send({ error: 'Missing message in request body' });
      return;
    }

    const systemInstruction = `You are a friendly and knowledgeable biblical assistant for the 'RCCG The Eagles Ark' church. The theme is "${theme || 'Encouragement'}". The scripture is ${scripture?.reference || ''} which reads: "${scripture?.text || ''}". Respond to the user's message in a concise, uplifting, and conversational style. Keep responses appropriate for a church audience.`;

    const prompt = `${systemInstruction}\nUser: ${message}\nAssistant:`;

    const text = await callGenAI(prompt);
    if (!text) throw new Error('Empty response from GenAI');
    const audio = await synthesizeVoice(text);

    res.json({ reply: text, audio });
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});
