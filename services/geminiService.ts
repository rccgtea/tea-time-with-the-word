
import { GoogleGenAI, Type } from "@google/genai";
import { Scripture } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // This is a placeholder for environments where API_KEY might not be set.
  // In the target environment, this variable is expected to be present.
  console.warn("API_KEY environment variable not set. Gemini API calls will fail.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    reference: { 
      type: Type.STRING,
      description: "The Bible book, chapter, and verse reference (e.g., 'John 3:16')."
    },
    versions: {
      type: Type.OBJECT,
      properties: {
        KJV: { type: Type.STRING, description: "King James Version text." },
        NKJV: { type: Type.STRING, description: "New King James Version text." },
        NIV: { type: Type.STRING, description: "New International Version text." },
        MSG: { type: Type.STRING, description: "The Message version text." },
        NLT: { type: Type.STRING, description: "New Living Translation text." },
        AMP: { type: Type.STRING, description: "Amplified Bible version text." },
      },
      required: ['KJV', 'NKJV', 'NIV', 'MSG', 'NLT', 'AMP'],
    },
  },
  required: ['reference', 'versions'],
};


export const getDailyScripture = async (theme: string, day: number): Promise<Scripture> => {
  const prompt = `
    You are a biblical assistant for the 'RCCG the Eagles Ark' church. 
    The theme for this month is "${theme}". 
    Provide a single, relevant bible scripture for day ${day} of the month that speaks to this theme. 
    The scripture should be encouraging and uplifting.
    Return ONLY a JSON object that strictly follows the provided schema. Do not add any commentary, explanation, or markdown formatting.
  `;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.7,
      },
    });

    // Fix: Per Gemini guidelines, access the text response via the .text property.
    const text = response.text.trim();
    const parsedJson = JSON.parse(text);

    // Basic validation to ensure the structure is correct
    if (parsedJson.reference && parsedJson.versions) {
      return parsedJson as Scripture;
    } else {
      throw new Error("Invalid JSON structure received from API.");
    }

  } catch (error) {
    console.error("Error fetching daily scripture from Gemini API:", error);
    throw new Error("Failed to generate the scripture for today. Please try again later.");
  }
};
