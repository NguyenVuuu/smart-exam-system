import { z } from 'zod'

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Identifier is required'),
  password: z.string().min(1, 'Password is required'),
})

export type LoginInput = z.infer<typeof loginSchema>
