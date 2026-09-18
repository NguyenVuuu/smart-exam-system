import { z } from 'zod'
import { paginationFields } from '../../utils/pagination'

export const notificationsQuerySchema = z.object({
  ...paginationFields,
})

export const notificationParamsSchema = z.object({
  notificationId: z.string().uuid(),
})

export type NotificationsQuery = z.infer<typeof notificationsQuerySchema>
