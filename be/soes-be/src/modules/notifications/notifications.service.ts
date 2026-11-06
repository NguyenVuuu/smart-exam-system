import { NotFoundError } from '../../errors/AppError'
import prisma from '../../lib/prisma'
import { toPagination } from '../../utils/pagination'
import { emitUserEvent } from '../proctoring/proctoring-realtime.events'
import { resolveBackofficePermissions } from '../auth/permissions/backoffice-permissions'
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

export async function notifyUsers(userIds: string[], title: string, content: string, options: { link?: string | null } = {}) {
  const notifications = await repository.createForUsers({ userIds, title, content, link: options.link })
  notifications.forEach(({ userId, ...notification }) => {
    emitUserEvent(userId, 'notification:created', notification)
  })
  return { count: notifications.length }
}

export async function notifyExamSchedulers(examTitle: string) {
  const [accounts, rolePermissions] = await Promise.all([
    prisma.admin.findMany({
      where: { status: 'ACTIVE', user: { status: 'ACTIVE' } },
      select: { role: true, userId: true, permissionOverrides: { select: { permission: true, allowed: true } } },
    }),
    prisma.backofficeRolePermission.findMany({ select: { role: true, permission: true } }),
  ])
  const userIds = accounts.filter((account) => resolveBackofficePermissions(
    rolePermissions.filter(({ role }) => role === account.role), account.permissionOverrides,
  ).includes('SCHEDULES_VIEW')).map(({ userId }) => userId)
  return notifyUsers(userIds, 'Đề cuối kỳ đã sẵn sàng', `Đề "${examTitle}" đã được duyệt và có thể lập lịch thi.`, {
    link: '/admin/exam-schedules',
  })
}
