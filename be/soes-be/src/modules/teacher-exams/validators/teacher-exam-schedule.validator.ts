import { z } from 'zod'

export const teacherExamScheduleBodySchema = z.object({
  courseOfferingId: z.string().trim().min(1),
  startTime: z.coerce.date(), endTime: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
  maxAttempts: z.coerce.number().int().min(1).max(10).default(1),
  password: z.string().trim().min(4).max(100).optional().nullable(),
  requireFullscreen: z.boolean().default(false), enableWebcam: z.boolean().default(false),
  blockCopyPaste: z.boolean().default(true), blockRightClick: z.boolean().default(true),
  locationMode: z.enum(['ONLINE', 'CAMPUS']).default('ONLINE'),
  allowedIpRanges: z.array(z.string().trim().min(1)).max(50).default([]),
  distributionMode: z.enum([
    'FIXED_ORDER', 'SHUFFLE_QUESTIONS', 'SHUFFLE_OPTIONS',
    'SHUFFLE_QUESTIONS_AND_OPTIONS', 'RANDOM_SUBSET',
  ]).default('FIXED_ORDER'),
  randomQuestionCount: z.coerce.number().int().min(1).optional().nullable(),
  resultReleaseMode: z.enum(['IMMEDIATE', 'MANUAL', 'SCHEDULED']).default('MANUAL'),
  resultReleaseAt: z.coerce.date().optional().nullable(),
  allowStudentReview: z.boolean().default(false),
}).superRefine((data, ctx) => {
  if (data.endTime <= data.startTime) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after start time' })
  if (data.locationMode === 'CAMPUS' && !data.allowedIpRanges.length) ctx.addIssue({ code: 'custom', path: ['allowedIpRanges'], message: 'Campus exam requires allowed IP ranges' })
  if (data.distributionMode === 'RANDOM_SUBSET' && !data.randomQuestionCount) ctx.addIssue({ code: 'custom', path: ['randomQuestionCount'], message: 'Random question count is required' })
  if (data.resultReleaseMode === 'SCHEDULED' && !data.resultReleaseAt) ctx.addIssue({ code: 'custom', path: ['resultReleaseAt'], message: 'Result release time is required' })
})

export const teacherScheduleCancellationSchema = z.object({ reason: z.string().trim().min(5).max(1000) })
export type TeacherExamScheduleBody = z.infer<typeof teacherExamScheduleBodySchema>
