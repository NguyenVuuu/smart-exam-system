import { z } from 'zod'

export const groupBodySchema = z.object({
  name: z.string().trim().min(3).max(120),
}).strict()

export const groupStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE']),
}).strict()
