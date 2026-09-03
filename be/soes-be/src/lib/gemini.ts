import { GoogleGenAI } from "@google/genai";
import { ValidationError } from "../errors/AppError";

let client: GoogleGenAI | null = null;

export const geminiConfig = {
  model: process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash",
  timeoutMs: Number(process.env.GEMINI_TIMEOUT_MS) || 120_000,
  maxQuestions: Number(process.env.AI_MAX_QUESTIONS_PER_RUN) || 50,
};

export function requireGemini() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new ValidationError("Gemini API is not configured");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}
