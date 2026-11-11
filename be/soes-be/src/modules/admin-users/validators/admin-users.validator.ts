import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)

export const usersQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
  role: z.enum(['ADMIN', 'EDUCATION_OFFICER', 'TEACHER', 'STUDENT']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  departmentId: id.optional(),
})

const createUserFields = z.object({
  role: z.enum(['ADMIN', 'EDUCATION_OFFICER', 'TEACHER', 'STUDENT']),
  roles: z.array(z.enum(['ADMIN', 'EDUCATION_OFFICER', 'TEACHER', 'STUDENT'])).min(1).max(3).optional(),
  code: z.string().trim().max(30)
    .transform((value) => value ? value.toUpperCase() : '')
    .refine((value) => !value || /^US\d+$/.test(value), 'Mã người dùng phải có dạng US + chữ số')
    .optional().default(''),
  fullName: z.string().trim().min(2).max(150),
  email: z.string().email().optional().nullable(),
  phoneNumber: z.string().trim().max(20).optional().nullable(),
  departmentId: id.optional().nullable(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  password: z.string().min(6).max(100).default('123456'),
})

export const createUserSchema = createUserFields.superRefine((data, ctx) => {
  if (!data.roles) return
  const roles = new Set(data.roles)
  if (roles.size !== data.roles.length || !roles.has(data.role) ||
    (roles.has('ADMIN') && roles.size > 1)) {
    ctx.addIssue({ code: 'custom', path: ['roles'], message: 'Vai trò Quản trị viên không kết hợp với vai trò khác' })
  }
})

export const updateUserSchema = createUserFields.omit({ role: true, password: true, roles: true })
export const addUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'EDUCATION_OFFICER']),
  departmentId: id.optional().nullable(),
})
export const addUserRoleParamsSchema = z.object({ userId: id })

export const accountStatusSchema = z.object({ status: z.enum(['ACTIVE', 'INACTIVE']) })
export const resetPasswordSchema = z.object({ password: z.string().min(6).max(100).default('123456') })
export const enrollmentBodySchema = z.object({ studentIds: z.array(id).min(1).max(1000) })
export const enrollmentQuerySchema = z.object({
  ...paginationFields,
  keyword: z.string().trim().max(200).optional(),
})

export type UsersQuery = z.infer<typeof usersQuerySchema>
export type CreateUserBody = z.infer<typeof createUserSchema>
export type AddUserRoleBody = z.infer<typeof addUserRoleSchema>
export type UpdateUserBody = z.infer<typeof updateUserSchema>
export type EnrollmentQuery = z.infer<typeof enrollmentQuerySchema>
