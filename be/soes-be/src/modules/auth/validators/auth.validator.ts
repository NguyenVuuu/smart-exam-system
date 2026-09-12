import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
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
export type UpdateMeInput = z.infer<typeof updateMeSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
