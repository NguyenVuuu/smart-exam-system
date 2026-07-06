import { z } from 'zod'

export const getSubjectsQuerySchema = z.object({
  page:       z.coerce.number().int().min(1).default(1),
  pageSize:   z.coerce.number().int().min(1).max(100).default(12),
  semesterId: z.string().trim().min(1).optional(),
  keyword:    z.string().trim().max(200).optional(),
})

export type GetSubjectsQuery = z.infer<typeof getSubjectsQuerySchema>
