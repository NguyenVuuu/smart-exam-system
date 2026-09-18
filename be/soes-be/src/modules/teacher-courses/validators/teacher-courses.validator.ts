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

export const proctorAssignmentsQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
  status: z.enum(['SCHEDULED', 'OPEN', 'CLOSED']).optional(),
  semesterId: z.string().trim().min(1).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
}).refine(({ from, to }) => !from || !to || from < to, {
  message: 'The end of the date range must be after the start',
  path: ['to'],
})

export type TeacherCoursesQuery = z.infer<typeof teacherCoursesQuerySchema>
export type CourseCollectionQuery = z.infer<typeof courseCollectionQuerySchema>
export type ProctorAssignmentsQuery = z.infer<typeof proctorAssignmentsQuerySchema>
