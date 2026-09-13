import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const id = z.string().trim().min(1)
const booleanQuery = z
  .union([z.boolean(), z.enum(['true', 'false'])])
  .optional()
  .default(false)
  .transform((value) => value === true || value === 'true')

export const notificationsQuerySchema = z.object({
  ...paginationFields,
  unreadOnly: booleanQuery,
})

export const notificationParamsSchema = z.object({ notificationId: id })

export const studentExamSchedulesQuerySchema = z.object({
  ...paginationFields,
  status: z.enum(['ALL', 'OPEN', 'UPCOMING', 'COMPLETED', 'EXPIRED']).optional().default('ALL'),
  semesterId: id.optional(),
  keyword: z.string().trim().max(200).optional(),
})

export const studentScoresQuerySchema = z.object({
  semesterId: id.optional(),
  courseOfferingId: id.optional(),
  keyword: z.string().trim().max(200).optional(),
})

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>
export type StudentExamSchedulesQuery = z.infer<typeof studentExamSchedulesQuerySchema>
export type StudentScoresQuery = z.infer<typeof studentScoresQuerySchema>
