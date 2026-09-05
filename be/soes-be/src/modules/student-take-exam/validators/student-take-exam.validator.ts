import { z } from 'zod'

export const examParamsSchema = z.object({
  scheduleId: z.string().min(1, { message: 'scheduleId is required' }),
})

export type ExamParams = z.infer<typeof examParamsSchema>

export const webcamStatusSchema = z.enum([
  'NOT_REQUIRED',
  'PENDING_PERMISSION',
  'ACTIVE',
  'DISCONNECTED',
  'PERMISSION_DENIED',
  'BLOCKED',
])

// ─── API 1: Start Exam ────────────────────────────────────────────────────────

export const startExamBodySchema = z.object({
  password: z.string().optional().nullable(),
  webcamConfirmed: z.boolean().optional().default(false),
  webcamStatus: webcamStatusSchema.optional(),
})

export type StartExamBody = z.infer<typeof startExamBodySchema>

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export const examAttemptParamsSchema = z.object({
  scheduleId: z.string().min(1, { message: 'scheduleId is required' }),
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
  scheduleId: z.string().min(1, { message: 'scheduleId is required' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
})

export type SaveAnswerParams = z.infer<typeof saveAnswerParamsSchema>


// ─── API 6: Send Heartbeat ─────────────────────────────────────────────────────

export const sendHeartbeatParamsSchema = z.object({
  scheduleId: z.string().min(1, { message: 'scheduleId is required' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
})

export type SendHeartbeatParams = z.infer<typeof sendHeartbeatParamsSchema>

export const sendHeartbeatBodySchema = z.object({
  webcamStatus: webcamStatusSchema.optional(),
})

export type SendHeartbeatBody = z.infer<typeof sendHeartbeatBodySchema>

export const violationTypeSchema = z.enum([
  'TAB_SWITCH',
  'FULLSCREEN_EXIT',
  'NO_FACE',
  'MULTIPLE_FACES',
  'INACTIVITY',
  'LOOKING_AWAY',
  'COPY_PASTE',
  'CAMERA_BLOCKED',
  'CAMERA_DISCONNECTED',
  'CAMERA_PERMISSION_DENIED',
  'SCREEN_SHARE_STOPPED',
  'SCREEN_PERMISSION_DENIED',
  'PROCTOR_WEBCAM_CAPTURE',
  'PROCTOR_SCREEN_CAPTURE',
])

export const severityLevelSchema = z.enum(['LOW', 'MEDIUM', 'HIGH'])

export const recordViolationBodySchema = z.object({
  violationType: violationTypeSchema,
  severity: severityLevelSchema,
  description: z.string().trim().max(500).optional(),
  detectedAt: z.string().datetime().optional(),
})

export type RecordViolationBody = z.infer<typeof recordViolationBodySchema>

export const endViolationParamsSchema = z.object({
  scheduleId: z.string().min(1, { message: 'scheduleId is required' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
  violationId: z.string().uuid({ message: 'violationId must be a valid UUID' }),
})

export const endViolationBodySchema = z.object({
  endedAt: z.string().datetime().optional(),
})

// ─── API 7: Run Code ───────────────────────────────────────────────────────────

export const runCodeParamsSchema = z.object({
  scheduleId: z.string().min(1, { message: 'scheduleId is required' }),
  attemptId: z.string().uuid({ message: 'attemptId must be a valid UUID' }),
  questionId: z.string().uuid({ message: 'questionId must be a valid UUID' }),
})

export type RunCodeParams = z.infer<typeof runCodeParamsSchema>

export const runCodeBodySchema = z.object({
  sourceCode: z.string().min(1, { message: 'sourceCode is required and cannot be empty' }),
})

export type RunCodeBody = z.infer<typeof runCodeBodySchema>
