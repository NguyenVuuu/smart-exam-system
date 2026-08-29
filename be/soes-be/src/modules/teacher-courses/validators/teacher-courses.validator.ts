import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

export const teacherCoursesQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
  semesterId: z.string().trim().min(1).optional(),
  subjectId: z.string().trim().min(1).optional(),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
})

export const courseCollectionQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
})

export type TeacherCoursesQuery = z.infer<typeof teacherCoursesQuerySchema>
export type CourseCollectionQuery = z.infer<typeof courseCollectionQuerySchema>
