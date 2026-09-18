import { z } from 'zod'

export const createGradeAppealSchema = z.object({
  reason: z.string().trim().min(10).max(2000),
})

export const teacherGradeAppealQuerySchema = z.object({
  status: z.enum(['ALL', 'PENDING', 'IN_REVIEW', 'RESOLVED', 'REJECTED']).optional().default('ALL'),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
})

export const updateGradeAppealSchema = z.object({
  status: z.enum(['IN_REVIEW', 'REJECTED']),
  teacherReply: z.string().trim().min(3).max(2000).optional(),
})

export type CreateGradeAppealBody = z.infer<typeof createGradeAppealSchema>
export type TeacherGradeAppealQuery = z.infer<typeof teacherGradeAppealQuerySchema>
export type UpdateGradeAppealBody = z.infer<typeof updateGradeAppealSchema>
