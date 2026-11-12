import { z } from 'zod'

export const askAgentSchema = z.object({
  message: z.string().trim().min(1).max(500),
  materialId: z.string().uuid().optional(),
})
export const scheduleParamSchema = z.object({ scheduleId: z.string().uuid() })

export const agentAnswerSchema = z.object({
  summary: z.string().max(1500),
  actions: z.array(z.string().max(500)).max(5),
  evidenceIds: z.array(z.string().max(100)).max(20),
  caveat: z.string().max(500).nullable(),
})

export const examMatrixRequestSchema = z.object({
  subjectId: z.string().trim().min(1).max(100),
  format: z.enum(['OBJECTIVE', 'PROGRAMMING', 'MIXED']),
  desiredCount: z.number().int().min(1).max(100),
  message: z.string().trim().min(1).max(500),
})

export const examMatrixProposalSchema = z.object({
  easyCount: z.number().int().min(0).max(100),
  mediumCount: z.number().int().min(0).max(100),
  hardCount: z.number().int().min(0).max(100),
  rationale: z.string().max(500),
})

export const practiceDraftSchema = z.object({ questions: z.array(z.object({
  stem: z.string().min(10).max(1000),
  options: z.array(z.string().min(1).max(300)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().min(10).max(500),
  supportQuote: z.string().min(10).max(300),
})).min(1).max(10) })

export const createPracticeSchema = z.object({
  materialId: z.string().uuid(), count: z.number().int().min(3).max(10).default(5),
})

export const practiceParamSchema = z.object({ practiceSetId: z.string().uuid() })
export const submitPracticeSchema = z.object({ answers: z.array(z.object({
  itemId: z.string().uuid(), selectedIndex: z.number().int().min(0).max(3),
})).min(1).max(10) })
