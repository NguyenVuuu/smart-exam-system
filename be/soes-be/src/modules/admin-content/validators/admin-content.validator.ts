import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)
export const contentQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
  departmentId: id.optional(), subjectId: id.optional(),
})
export const questionBankQuerySchema = contentQuerySchema.extend({
  status: z.enum(['APPROVED', 'REMOVED']).optional(),
})
export const examTrackingQuerySchema = contentQuerySchema.extend({
  semesterId: id.optional(),
  type: z.enum(['QUIZ', 'MIDTERM', 'FINAL']).optional(),
  status: z.enum(['DRAFT', 'READY', 'LOCKED', 'ARCHIVED']).optional(),
  approvalStatus: z.enum(['NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED']).optional(),
})
export const removalSchema = z.object({ reason: z.string().trim().min(5).max(1000) })
export const itemParamSchema = z.object({ id: id })

export type QuestionBankQuery = z.infer<typeof questionBankQuerySchema>
export type ExamTrackingQuery = z.infer<typeof examTrackingQuerySchema>
