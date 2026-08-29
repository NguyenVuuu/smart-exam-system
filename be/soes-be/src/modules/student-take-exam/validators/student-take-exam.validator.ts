import { z } from 'zod'

export const examParamsSchema = z.object({
  examId: z.string().uuid({ message: 'examId must be a valid UUID' }),
})

export type ExamParams = z.infer<typeof examParamsSchema>

// ─── API 1: Start Exam ────────────────────────────────────────────────────────

export const startExamBodySchema = z.object({
  password: z.string().optional().nullable(),
  webcamConfirmed: z.boolean().optional().default(false),
})

export type StartExamBody = z.infer<typeof startExamBodySchema>

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


// ─── API 6: Send Heartbeat ─────────────────────────────────────────────────────

export const sendHeartbeatParamsSchema = z.object({
  examId:    z.string().uuid({ message: 'examId must be a valid UUID' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
})

export type SendHeartbeatParams = z.infer<typeof sendHeartbeatParamsSchema>

// ─── API 7: Run Code ───────────────────────────────────────────────────────────

export const runCodeParamsSchema = z.object({
  examId:    z.string().uuid({ message: 'examId must be a valid UUID' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
  questionId: z.string().uuid({ message: 'questionId must be a valid UUID' }),
})

export type RunCodeParams = z.infer<typeof runCodeParamsSchema>

export const runCodeBodySchema = z.object({
  sourceCode: z.string().min(1, { message: 'sourceCode is required and cannot be empty' }),
})

export type RunCodeBody = z.infer<typeof runCodeBodySchema>
