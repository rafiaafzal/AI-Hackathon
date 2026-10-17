import { GoogleGenAI } from '@google/genai';

export const MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
export const EMBED_MODEL = process.env.GEMINI_EMBED_MODEL || 'gemini-embedding-001';
export const EMBED_DIM = 1536;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

function l2Normalize(vector: number[]): number[] {
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm === 0) {
    return vector;
  }
  return vector.map((val) => val / norm);
}

export async function generateJSON<T>(system: string, prompt: string): Promise<T> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: system,
      responseMimeType: 'application/json',
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('No text returned from Gemini API');
  }

  return JSON.parse(text) as T;
}

export async function generateText(system: string, prompt: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      systemInstruction: system,
    },
  });

  return response.text ?? '';
}

export async function embed(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) {
    return [];
  }

  const response = await ai.models.embedContent({
    model: EMBED_MODEL,
    contents: texts,
    config: {
      outputDimensionality: EMBED_DIM,
    },
  });

  const embeddings = response.embeddings ?? [];
  return embeddings.map((e) => l2Normalize(e.values ?? []));
}
