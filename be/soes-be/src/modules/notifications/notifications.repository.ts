import prisma from '../../lib/prisma'
import type { NotificationsQuery } from './notifications.validator'

export function listForUser(userId: string, query: NotificationsQuery) {
  const where = { userId }
  return Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
    prisma.notification.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, content: true, isRead: true, createdAt: true },
    }),
  ])
}

export function markRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  })
}

export function markAllRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  })
}

export function createForUsers(input: { userIds: string[]; title: string; content: string }) {
  const userIds = [...new Set(input.userIds)].filter(Boolean)
  if (!userIds.length) return Promise.resolve([])
  return prisma.$transaction(
    userIds.map((userId) =>
      prisma.notification.create({
        data: { userId, title: input.title, content: input.content },
        select: { id: true, userId: true, title: true, content: true, isRead: true, createdAt: true },
      }),
    ),
  )
}
