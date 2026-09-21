import prisma from '../../../lib/prisma'
import { studentVisibleScheduleWhere } from '../../student-common/exam-visibility.policy'
import type { NotificationsQuery, StudentExamSchedulesQuery, StudentScoresQuery } from '../validators/student-portal.validator'

export function listNotifications(userId: string, query: NotificationsQuery) {
  const where = { userId, ...(query.unreadOnly ? { isRead: false } : {}) }
  return Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.findMany({
      where,
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: { createdAt: 'desc' },
      select: { id: true, title: true, content: true, link: true, isRead: true, createdAt: true },
    }),
  ])
}

export function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { isRead: true } })
}

export function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
}

export function listVisibleSchedules(studentId: string, query: StudentExamSchedulesQuery) {
  return prisma.examSchedule.findMany({
    where: {
      ...studentVisibleScheduleWhere(),
      ...(query.keyword
        ? {
            OR: [
              { title: { contains: query.keyword, mode: 'insensitive' } },
              { scheduleCourses: { some: { courseOffering: { code: { contains: query.keyword, mode: 'insensitive' } } } } },
              { scheduleCourses: { some: { courseOffering: { subject: { name: { contains: query.keyword, mode: 'insensitive' } } } } } },
              { scheduleCourses: { some: { courseOffering: { subject: { code: { contains: query.keyword, mode: 'insensitive' } } } } } },
              { scheduleCourses: { some: { courseOffering: { teacher: { user: { fullName: { contains: query.keyword, mode: 'insensitive' } } } } } } },
            ],
          }
        : {}),
      scheduleCourses: {
        some: {
          courseOffering: {
            semesterId: query.semesterId,
            enrollments: { some: { studentId } },
          },
        },
      },
    },
    orderBy: [{ startTime: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      title: true,
      startTime: true,
      endTime: true,
      durationMinutes: true,
      maxAttempts: true,
      passwordHash: true,
      enableWebcam: true,
      enableScreenMonitoring: true,
      publishedAt: true,
      attempts: {
        where: { studentId },
        orderBy: { attemptNo: 'desc' },
        select: { id: true, status: true, deadlineAt: true },
      },
      scheduleCourses: {
        where: { courseOffering: { enrollments: { some: { studentId } } } },
        take: 1,
        select: {
          courseOffering: {
            select: {
              id: true,
              code: true,
              subject: { select: { code: true, name: true } },
              teacher: { select: { user: { select: { fullName: true } } } },
            },
          },
        },
      },
    },
  })
}

export function listReleasedScores(studentId: string, query: StudentScoresQuery) {
  return prisma.examAttempt.findMany({
    where: {
      studentId,
      totalScore: { not: null },
      status: 'PUBLISHED',
      courseOfferingId: query.courseOfferingId,
      courseOffering: {
        semesterId: query.semesterId,
      },
      ...(query.keyword
        ? {
            OR: [
              { examSchedule: { title: { contains: query.keyword, mode: 'insensitive' } } },
              { courseOffering: { code: { contains: query.keyword, mode: 'insensitive' } } },
              { courseOffering: { subject: { name: { contains: query.keyword, mode: 'insensitive' } } } },
              { courseOffering: { subject: { code: { contains: query.keyword, mode: 'insensitive' } } } },
            ],
          }
        : {}),
    },
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true,
      totalScore: true,
      courseOffering: { select: { id: true, code: true, subject: { select: { code: true, name: true } } } },
      examSchedule: {
        select: {
          id: true,
          title: true,
          resultsPublishedAt: true,
          publishedAt: true,
          exam: { select: { type: true } },
        },
      },
    },
  })
}
