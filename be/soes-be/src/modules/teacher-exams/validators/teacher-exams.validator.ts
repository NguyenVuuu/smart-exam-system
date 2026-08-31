import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)

export const examsQuerySchema = z.object({
  ...paginationFields, keyword: z.string().trim().max(200).optional(), subjectId: id.optional(), semesterId: id.optional(),
  type: z.enum(['QUIZ', 'MIDTERM', 'FINAL']).optional(),
  status: z.enum(['DRAFT', 'READY', 'LOCKED', 'ARCHIVED']).optional(),
  approvalStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
})

export const examBodySchema = z.object({
  title: z.string().trim().min(5).max(250), description: z.string().trim().max(2000).optional().nullable(),
  subjectId: id, semesterId: id, type: z.enum(['QUIZ', 'MIDTERM', 'FINAL']),
  format: z.enum(['OBJECTIVE', 'PROGRAMMING', 'MIXED']),
  creationMethod: z.enum(['MANUAL', 'QUESTION_BANK', 'AI_GENERATED', 'MIXED']).default('MANUAL'),
  defaultDurationMinutes: z.coerce.number().int().min(1).max(1440),
  totalPoints: z.coerce.number().positive().max(1000),
  sections: z.array(z.object({
    id: id, title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(500).optional().nullable(),
    type: z.enum(['OBJECTIVE', 'PROGRAMMING']),
    targetPoints: z.coerce.number().positive().max(1000),
    orderIndex: z.coerce.number().int().positive(),
  })).min(1).max(20),
}).superRefine((data, context) => {
  if (new Set(data.sections.map(({ id }) => id)).size !== data.sections.length) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section IDs must be unique' })
  }
  if (new Set(data.sections.map(({ orderIndex }) => orderIndex)).size !== data.sections.length) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section order must be unique' })
  }
  const sectionPoints = data.sections.reduce((sum, section) => sum + section.targetPoints, 0)
  if (Math.abs(sectionPoints - data.totalPoints) > 0.001) {
    context.addIssue({ code: 'custom', path: ['sections'], message: 'Section points must equal exam total points' })
  }
})

export const examQuestionsSchema = z.object({
  items: z.array(z.object({
    questionId: id, sectionId: id.optional(), points: z.coerce.number().positive().max(1000),
  })).min(1).max(500),
})

export const examApprovalQuerySchema = z.object({
  ...paginationFields, keyword: z.string().trim().max(200).optional(), subjectId: id.optional(), semesterId: id.optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).default('PENDING'),
})

export const examRejectionSchema = z.object({ reason: z.string().trim().min(5).max(1000) })
export const extendTimeBodySchema = z.object({
  attemptId: z.string().trim().min(1),
  extraMinutes: z.coerce.number().int().min(1).max(180),
  reason: z.string().trim().min(3).max(500),
})

export type ExamsQuery = z.infer<typeof examsQuerySchema>
export type ExamBody = z.infer<typeof examBodySchema>
export type ExamQuestionInput = z.infer<typeof examQuestionsSchema>['items'][number]
export type ExamApprovalQuery = z.infer<typeof examApprovalQuerySchema>
export type ExtendTimeBody = z.infer<typeof extendTimeBodySchema>
