import { z } from 'zod'

export const examParamsSchema = z.object({
  examId: z.string().uuid('examId must be a valid UUID'),
})

export type ExamParams = z.infer<typeof examParamsSchema>

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export const examAttemptParamsSchema = z.object({
  examId:    z.string().uuid('examId must be a valid UUID'),
  attemptId: z.string().uuid('attemptId must be a valid UUID'),
})

export type ExamAttemptParams = z.infer<typeof examAttemptParamsSchema>
