import { z } from 'zod'

export const examParamsSchema = z.object({
  examId: z.string().min(1, 'examId is required'),
})

export type ExamParams = z.infer<typeof examParamsSchema>

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export const examAttemptParamsSchema = z.object({
  examId:    z.string().min(1, 'examId is required'),
  attemptId: z.string().min(1, 'attemptId is required'),
})

export type ExamAttemptParams = z.infer<typeof examAttemptParamsSchema>
