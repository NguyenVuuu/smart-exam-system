import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'
import { EXAM_SCHEDULE_DEFAULTS } from '../constants/exam-schedule.defaults'

const id = z.string().trim().min(1)

export const schedulesQuerySchema = z.object({
  ...paginationFields, keyword: z.string().trim().max(200).optional(),
  semesterId: id.optional(), departmentId: id.optional(), subjectId: id.optional(),
  status: z.enum(['DRAFT', 'SCHEDULED', 'OPEN', 'CLOSED', 'CANCELLED']).optional(),
})

export const scheduleBodySchema = z.object({
  title: z.string().trim().min(5).max(250), examId: id,
  startTime: z.coerce.date(), endTime: z.coerce.date(),
  durationMinutes: z.coerce.number().int().min(1).max(1440), maxAttempts: z.coerce.number().int().min(1).max(10),
  password: z.string().trim().min(4).max(100).optional().nullable(),
  enableTabLock: z.boolean().default(EXAM_SCHEDULE_DEFAULTS.enableTabLock),
  requireFullscreen: z.boolean().default(EXAM_SCHEDULE_DEFAULTS.requireFullscreen),
  enableWebcam: z.boolean().default(EXAM_SCHEDULE_DEFAULTS.enableWebcam),
  enableScreenMonitoring: z.boolean().default(EXAM_SCHEDULE_DEFAULTS.enableScreenMonitoring),
  blockCopyPaste: z.boolean().default(EXAM_SCHEDULE_DEFAULTS.blockCopyPaste),
  blockRightClick: z.boolean().default(EXAM_SCHEDULE_DEFAULTS.blockRightClick),
  locationMode: z.enum(['ONLINE', 'CAMPUS']).default('ONLINE'),
  allowedIpRanges: z.array(z.string().trim().min(1)).max(50).default([]),
  distributionMode: z.enum(['FIXED_ORDER', 'SHUFFLE_QUESTIONS', 'SHUFFLE_OPTIONS', 'SHUFFLE_QUESTIONS_AND_OPTIONS', 'RANDOM_SUBSET']).default('FIXED_ORDER'),
  randomQuestionCount: z.coerce.number().int().min(1).optional().nullable(),
  resultReleaseMode: z.enum(['IMMEDIATE', 'MANUAL', 'SCHEDULED', 'NEVER']).default('MANUAL'),
  resultReleaseAt: z.coerce.date().optional().nullable(),
  reviewPolicy: z.enum(['NONE', 'SCORE_ONLY', 'ANSWERS_NO_KEY', 'FULL_AFTER_RELEASE']).default('NONE'),
  reviewStartAt: z.coerce.date().optional().nullable(), reviewEndAt: z.coerce.date().optional().nullable(),
  status: z.enum(['DRAFT', 'SCHEDULED']).default('DRAFT'),
  courses: z.array(z.object({ courseOfferingId: id, teacherIds: z.array(id).min(1).max(10) })).min(1).max(100),
}).superRefine((data, ctx) => {
  if (data.status === 'SCHEDULED' && data.startTime <= new Date()) ctx.addIssue({ code: 'custom', path: ['startTime'], message: 'Start time must be in the future' })
  if (data.endTime <= data.startTime) ctx.addIssue({ code: 'custom', path: ['endTime'], message: 'End time must be after start time' })
  const courseIds = data.courses.map(({ courseOfferingId }) => courseOfferingId)
  if (new Set(courseIds).size !== courseIds.length) ctx.addIssue({ code: 'custom', path: ['courses'], message: 'Course offerings must be unique' })
  data.courses.forEach(({ teacherIds }, index) => {
    if (new Set(teacherIds).size !== teacherIds.length) ctx.addIssue({ code: 'custom', path: ['courses', index, 'teacherIds'], message: 'Proctors must be unique' })
  })
  if (data.locationMode === 'CAMPUS' && !data.allowedIpRanges.length) ctx.addIssue({ code: 'custom', path: ['allowedIpRanges'], message: 'Campus exam requires allowed IP ranges' })
  if (data.distributionMode === 'RANDOM_SUBSET' && !data.randomQuestionCount) ctx.addIssue({ code: 'custom', path: ['randomQuestionCount'], message: 'Random question count is required' })
  if (data.resultReleaseMode === 'SCHEDULED' && !data.resultReleaseAt) ctx.addIssue({ code: 'custom', path: ['resultReleaseAt'], message: 'Result release time is required' })
  if (data.reviewStartAt && data.reviewEndAt && data.reviewEndAt <= data.reviewStartAt) ctx.addIssue({ code: 'custom', path: ['reviewEndAt'], message: 'Review end time must be after review start time' })
})

export const cancellationSchema = z.object({ reason: z.string().trim().min(5).max(1000) })
export type SchedulesQuery = z.infer<typeof schedulesQuerySchema>
export type ScheduleBody = z.infer<typeof scheduleBodySchema>
