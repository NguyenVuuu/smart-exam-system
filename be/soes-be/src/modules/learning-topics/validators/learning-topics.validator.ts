import { z } from 'zod'

export const subjectParamSchema = z.object({ subjectId: z.string().uuid() })
export const questionParamSchema = z.object({ questionId: z.string().uuid() })
export const createTopicSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9_-]{2,32}$/),
  name: z.string().trim().min(3).max(120),
})
export const assignTopicsSchema = z.object({
  topicIds: z.array(z.string().uuid()).max(10).refine((ids) => new Set(ids).size === ids.length),
})

export type CreateTopicInput = z.infer<typeof createTopicSchema>
