import { NotFoundError } from '../../errors/AppError'
import { toPagination } from '../../utils/pagination'
import * as repository from './notifications.repository'
import type { NotificationsQuery } from './notifications.validator'

export async function list(userId: string, query: NotificationsQuery) {
  const [totalItems, unreadCount, items] = await repository.listForUser(userId, query)
  return {
    items,
    unreadCount,
    pagination: toPagination(query.page, query.pageSize, totalItems),
  }
}

export async function markRead(userId: string, notificationId: string) {
  const result = await repository.markRead(userId, notificationId)
  if (!result.count) throw new NotFoundError('Notification not found')
  return { id: notificationId, isRead: true }
}

export async function markAllRead(userId: string) {
  const result = await repository.markAllRead(userId)
  return { updatedCount: result.count }
}
