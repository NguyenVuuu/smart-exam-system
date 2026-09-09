import { GoogleGenAI } from "@google/genai";
import { ValidationError } from "../errors/AppError";

let client: GoogleGenAI | null = null;

export const geminiConfig = {
  get model(): string {
    return process.env.GEMINI_MODEL?.trim() || "gemini-3.1-flash-lite";
  },
  get timeoutMs(): number {
    return Number(process.env.GEMINI_TIMEOUT_MS) || 120_000;
  },
  get maxQuestions(): number {
    return Number(process.env.AI_MAX_QUESTIONS_PER_RUN) || 50;
  },
} as const;

export function requireGemini() {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new ValidationError("Gemini API is not configured");
  client ??= new GoogleGenAI({ apiKey });
  return client;
}
