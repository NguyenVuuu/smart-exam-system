import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const keyword = z.string().trim().max(200).optional()
const id = z.string().trim().min(1)

export const semesterQuerySchema = z.object({
  ...paginationFields,
  keyword,
  status: z.enum(['UPCOMING', 'ACTIVE', 'CLOSED']).optional(),
  academicYear: z.string().trim().optional(),
})

export const semesterBodySchema = z.object({
  academicYear: z.string().regex(/^\d{4}-\d{4}$/),
  term: z.enum(['TERM_1', 'TERM_2', 'TERM_3']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
}).refine((data) => data.endDate > data.startDate, {
  path: ['endDate'], message: 'End date must be after start date',
})

export const departmentQuerySchema = z.object({
  ...paginationFields, keyword,
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const departmentBodySchema = z.object({
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(150),
  description: z.string().trim().max(500).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const departmentHeadSchema = z.object({ teacherId: id.nullable() })

export const subjectQuerySchema = z.object({
  ...paginationFields, keyword,
  departmentId: id.optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
})

export const subjectBodySchema = z.object({
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(200),
  credits: z.coerce.number().int().min(1).max(20),
  departmentId: id,
  description: z.string().trim().max(1000).optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
})

export const courseOfferingQuerySchema = z.object({
  ...paginationFields, keyword,
  semesterId: id.optional(), departmentId: id.optional(), subjectId: id.optional(),
  status: z.enum(['ACTIVE', 'CLOSED']).optional(),
})

export const courseOfferingBodySchema = z.object({
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  semesterId: id, subjectId: id, teacherId: id,
  maxCapacity: z.coerce.number().int().min(1).max(1000),
  status: z.enum(['ACTIVE', 'CLOSED']).default('ACTIVE'),
})

export type SemesterQuery = z.infer<typeof semesterQuerySchema>
export type SemesterBody = z.infer<typeof semesterBodySchema>
export type DepartmentQuery = z.infer<typeof departmentQuerySchema>
export type DepartmentBody = z.infer<typeof departmentBodySchema>
export type SubjectQuery = z.infer<typeof subjectQuerySchema>
export type SubjectBody = z.infer<typeof subjectBodySchema>
export type CourseOfferingQuery = z.infer<typeof courseOfferingQuerySchema>
export type CourseOfferingBody = z.infer<typeof courseOfferingBodySchema>
