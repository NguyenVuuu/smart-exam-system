import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

export const submissionQuerySchema = z.object(paginationFields)
export const manualGradeSchema = z.object({
  score: z.coerce.number().min(0).max(1000),
  reason: z.string().trim().min(5).max(1000),
})
export const resultReleaseSchema = z.object({
  mode: z.enum(['IMMEDIATE', 'MANUAL', 'SCHEDULED']),
  releaseAt: z.coerce.date().optional().nullable(),
  published: z.boolean().default(false),
})

export const violationReviewSchema = z.object({
  reviewStatus: z.enum(['PENDING', 'CONFIRMED', 'DISMISSED']),
  reviewNote: z.string().trim().max(1000).optional().nullable(),
})

export const invalidateAttemptSchema = z.object({
  reason: z.string().trim().min(5).max(1000),
})

export type SubmissionQuery = z.infer<typeof submissionQuerySchema>
export type ManualGradeBody = z.infer<typeof manualGradeSchema>
export type ResultReleaseBody = z.infer<typeof resultReleaseSchema>
export type ViolationReviewBody = z.infer<typeof violationReviewSchema>
export type InvalidateAttemptBody = z.infer<typeof invalidateAttemptSchema>
