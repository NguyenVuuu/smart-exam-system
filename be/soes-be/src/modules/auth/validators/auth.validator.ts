import { z } from 'zod'

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
})

export const selectRoleSchema = z.object({
  selectionToken: z.string().uuid('Invalid selection token'),
  role: z.enum(['ADMIN', 'EDUCATION_OFFICER', 'TEACHER', 'DEPARTMENT_HEAD', 'STUDENT']),
})

export const updateMeSchema = z.object({
  email: z.string().trim().email('Email is invalid').optional().nullable().or(z.literal('')),
  phoneNumber: z.string().trim().max(20, 'Phone number is too long').optional().nullable().or(z.literal('')),
})

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters').max(100),
})

export type LoginInput = z.infer<typeof loginSchema>
export type SelectRoleInput = z.infer<typeof selectRoleSchema>
export type UpdateMeInput = z.infer<typeof updateMeSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
