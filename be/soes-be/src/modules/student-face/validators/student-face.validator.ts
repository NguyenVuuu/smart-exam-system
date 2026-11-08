import { z } from 'zod'

export const startSchema = z.object({
  purpose: z.enum(['ENROLLMENT', 'EXAM_ENTRY']),
  scheduleId: z.string().uuid().optional(),
  retainImageConsent: z.boolean().optional(),
}).refine((value) => value.purpose !== 'EXAM_ENTRY' || !!value.scheduleId, { message: 'scheduleId is required' })

export const idSchema = z.object({ id: z.string().uuid() })
export const manualParamsSchema = z.object({ scheduleId: z.string().uuid(), studentId: z.string().uuid() })
export const reviewImageParamsSchema = manualParamsSchema.extend({ kind: z.enum(['enrollment', 'latest-failed']) })
export const manualBodySchema = z.object({ reason: z.string().trim().min(10).max(500) })
export const scheduleParamsSchema = z.object({ scheduleId: z.string().uuid() })
