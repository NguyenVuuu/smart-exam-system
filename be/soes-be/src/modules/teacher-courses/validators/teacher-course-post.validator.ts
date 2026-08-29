import { z } from 'zod'

export const postBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
})

export const postPinSchema = z.object({ isPinned: z.boolean() })
export type PostBody = z.infer<typeof postBodySchema>
