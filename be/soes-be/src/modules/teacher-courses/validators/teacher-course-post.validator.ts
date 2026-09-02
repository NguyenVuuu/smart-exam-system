import { z } from 'zod'

export const postBodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  removedAttachmentIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val)
        return Array.isArray(parsed) ? parsed : [parsed]
      } catch {
        return val ? [val] : []
      }
    }
    return val
  }, z.array(z.string())).optional(),
})

export const postPinSchema = z.object({ isPinned: z.boolean() })
export type PostBody = z.infer<typeof postBodySchema>
