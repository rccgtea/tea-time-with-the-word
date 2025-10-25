import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

// Read API key from functions config or environment variable.
const GENAI_API_KEY = functions.config().genai?.key || process.env.GENAI_KEY;
if (!GENAI_API_KEY) {
  console.warn('GenAI API key not configured. Set it with `firebase functions:config:set genai.key="YOUR_KEY"` or as GENAI_KEY env var.');
}

async function callGenAI(prompt: string) {
  if (!GENAI_API_KEY) throw new Error('GenAI API key not configured');

  // Use Google Generative Language REST endpoint (v1beta2). We use an API key in the query string.
  const model = 'text-bison@001'; // fallback model name — adjust if you have a different model
  const url = `https://generativelanguage.googleapis.com/v1beta2/models/${encodeURIComponent(model)}:generateText?key=${encodeURIComponent(GENAI_API_KEY)}`;

  const body = {
    prompt: { text: prompt },
    temperature: 0.7,
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
  // Expected shape: { candidates: [ { output: '...' } ] }
  const text = (json && (json.candidates?.[0]?.output || json.candidates?.[0]?.content)) || json?.output || '';
  return text;
}

async function generateScriptureFor(theme: string, day: number) {
  const prompt = `You are a biblical assistant for the 'RCCG the Eagles Ark' church. The theme for this month is "${theme}". Provide a single, relevant bible scripture for day ${day} of the month that speaks to this theme. Return ONLY a JSON object that follows the schema with fields 'reference' and 'versions' (versions should include KJV, NKJV, NIV, MSG, NLT, AMP).`;

  const text = await callGenAI(prompt);
  if (!text) throw new Error('Empty response from GenAI');
  const parsed = JSON.parse(text.trim());
  if (!parsed.reference || !parsed.versions) throw new Error('Invalid scripture JSON');
  return parsed;
}

// HTTPS endpoint that returns today's scripture (reads Firestore or generates on-demand)
export const getTodaysScripture = functions.https.onRequest(async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const docRef = db.collection('meta').doc('dailyScripture');
    const snap = await docRef.get();
    if (snap.exists) {
      const data = snap.data() as Record<string, any>;
      if (data && data[today]) {
        res.json(data[today]);
        return;
      }
    }

    // If not present, generate on-demand (safe fallback). Read current theme.
    const themeDoc = await db.collection('meta').doc('themes').get();
    const monthName = new Date().toLocaleString('en-US', { month: 'long' });
    const currentTheme = (themeDoc.data() || {})[monthName] || 'Encouragement';
    const day = new Date().getDate();
    const scripture = await generateScriptureFor(currentTheme, day);

    // Save under today key
    await docRef.set({ [today]: scripture }, { merge: true });
    res.json(scripture);
  } catch (err) {
    console.error('Error in getTodaysScripture:', err);
    res.status(500).json({ error: 'Failed to get today\'s scripture' });
  }
});

// Scheduled function runs daily at midnight in specified timezone and writes scripture to Firestore
export const scheduledDailyScripture = functions.pubsub
  .schedule('0 0 * * *') // midnight
  .timeZone('Africa/Lagos')
  .onRun(async (context) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const themeDoc = await db.collection('meta').doc('themes').get();
      const monthName = new Date().toLocaleString('en-US', { month: 'long' });
      const currentTheme = (themeDoc.data() || {})[monthName] || 'Encouragement';
      const day = new Date().getDate();
      const scripture = await generateScriptureFor(currentTheme, day);
      const docRef = db.collection('meta').doc('dailyScripture');
      await docRef.set({ [today]: scripture }, { merge: true });
      console.log('Daily scripture generated for', today);
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

    res.json({ reply: text });
  } catch (err) {
    console.error('Error in chat endpoint:', err);
    res.status(500).json({ error: 'Failed to generate chat response' });
  }
});
