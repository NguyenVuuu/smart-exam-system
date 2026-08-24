import { z } from 'zod'

export const examParamsSchema = z.object({
  examId: z.string().uuid({ message: 'examId must be a valid UUID' }),
})

export type ExamParams = z.infer<typeof examParamsSchema>

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export const examAttemptParamsSchema = z.object({
  examId:    z.string().uuid({ message: 'examId must be a valid UUID' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
})

export type ExamAttemptParams = z.infer<typeof examAttemptParamsSchema>

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export const saveAnswerBodySchema = z.object({
  questionId: z.string().uuid({ message: 'questionId must be a valid UUID' }),
  answer: z.union([
    z.string(),
    z.array(z.string())
  ]),
})

export type SaveAnswerBody = z.infer<typeof saveAnswerBodySchema>

export const saveAnswerParamsSchema = z.object({
  examId:    z.string().uuid({ message: 'examId must be a valid UUID' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
})

export type SaveAnswerParams = z.infer<typeof saveAnswerParamsSchema>
