import { ThinkingLevel, type ThinkingConfig } from '@google/genai'
import type { GenerationRequirements } from '../schemas/generation-requirements'

export function generationThinkingConfig(model: string): ThinkingConfig | undefined {
  // Keep a small reasoning allowance for checking answers; Gemini 3 uses levels, 2.5 uses token budgets.
  if (/^(models\/)?gemini-3[.-]/.test(model)) return { thinkingLevel: ThinkingLevel.LOW }
  if (/^(models\/)?gemini-2\.5-/.test(model)) return { thinkingBudget: 1024 }
  return undefined
}

export function generationTokenLimit(request: GenerationRequirements): number {
  const tokensPerQuestion = request.targetQuestionType === 'MULTIPLE_CHOICE' ? 1000 : 1800
  return Math.min(65536, Math.max(4096, request.questionCount * tokensPerQuestion + 2048))
}
