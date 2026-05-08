import { GoogleGenerativeAI } from "@google/generative-ai";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

function getClient() {
  if (!GEMINI_API_KEY) return null;
  return new GoogleGenerativeAI(GEMINI_API_KEY);
}

export async function callGemini(prompt: string): Promise<string> {
  const client = getClient();
  if (!client) throw new Error("Missing GEMINI_API_KEY");

  const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
  const res = await model.generateContent(prompt);
  return res.response.text();
}


