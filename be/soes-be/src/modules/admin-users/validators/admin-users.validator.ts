import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)

export const usersQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  departmentId: id.optional(),
})

export const createUserSchema = z.object({
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']),
  code: z.string().trim().min(2).max(30).transform((value) => value.toUpperCase()),
  fullName: z.string().trim().min(2).max(150),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().trim().max(20).optional().nullable(),
  departmentId: id.optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  password: z.string().min(6).max(100).default('123456'),
})

export const updateUserSchema = createUserSchema.omit({ role: true, password: true })

export const accountStatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) })
export const resetPasswordSchema = z.object({ password: z.string().min(6).max(100).default('123456') })
export const enrollmentBodySchema = z.object({ studentIds: z.array(id).min(1).max(1000) })

export type UsersQuery = z.infer<typeof usersQuerySchema>
export type CreateUserBody = z.infer<typeof createUserSchema>
export type UpdateUserBody = z.infer<typeof updateUserSchema>
