import { NotFoundError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import type { StudentExamSchedulesQuery, StudentScoresQuery, NotificationsQuery } from '../validators/student-portal.validator'
import * as repo from '../repositories/student-portal.repository'

const submittedStatuses = ['SUBMITTED', 'GRADING', 'GRADED', 'PUBLISHED', 'AUTO_SUBMITTED', 'INVALIDATED']
type AggregatedExamStatus = 'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'

function examStatus(row: Awaited<ReturnType<typeof repo.listVisibleSchedules>>[number], now = new Date()): AggregatedExamStatus {
  const attempt = row.attempts[0]
  const attemptUsed = row._count.attempts
  const remainingAttempts = Math.max(0, row.maxAttempts - attemptUsed)
  if (attempt?.status && submittedStatuses.includes(attempt.status)) return 'COMPLETED'
  if (attempt?.status === 'IN_PROGRESS' && now < attempt.deadlineAt) return 'OPEN'
  if (now < row.startTime) return 'UPCOMING'
  if (now >= row.endTime) return 'EXPIRED'
  return remainingAttempts > 0 || attempt?.status === 'IN_PROGRESS' ? 'OPEN' : 'COMPLETED'
}

export async function getNotifications(userId: string, query: NotificationsQuery) {
  const [totalItems, rows] = await repo.listNotifications(userId, query)
  return { items: rows, pagination: toPagination(query.page, query.pageSize, totalItems) }
}

export async function markNotificationRead(userId: string, notificationId: string) {
  const updated = await repo.markNotificationRead(userId, notificationId)
  if (!updated.count) throw new NotFoundError('Notification not found')
  return { id: notificationId, isRead: true }
}

export async function markAllNotificationsRead(userId: string) {
  const updated = await repo.markAllNotificationsRead(userId)
  return { updatedCount: updated.count }
}

export async function getExamSchedules(studentId: string, query: StudentExamSchedulesQuery) {
  const rows = await repo.listVisibleSchedules(studentId, query)
  const rowsWithStatus = rows.map((row) => ({ row, status: examStatus(row) }))
  const statusCounts: Record<AggregatedExamStatus, number> = { OPEN: 0, UPCOMING: 0, COMPLETED: 0, EXPIRED: 0 }
  rowsWithStatus.forEach(({ status }) => {
    statusCounts[status] += 1
  })
  const statusRows = rowsWithStatus.filter(({ status }) => query.status === 'ALL' || status === query.status)

  const totalItems = statusRows.length
  const start = (query.page - 1) * query.pageSize
  const items = statusRows.slice(start, start + query.pageSize).map(({ row, status }) => {
    const courseOffering = row.scheduleCourses[0]?.courseOffering
    return {
      id: row.id,
      title: row.title,
      courseOfferingId: courseOffering?.id ?? '',
      courseCode: courseOffering?.code ?? '',
      subjectCode: courseOffering?.subject.code ?? '',
      subjectName: courseOffering?.subject.name ?? '',
      teacherName: courseOffering?.teacher.user.fullName ?? '',
      startTime: row.startTime,
      endTime: row.endTime,
      durationMinutes: row.durationMinutes,
      publishedAt: row.publishedAt,
      attemptId: row.attempts[0]?.id ?? null,
      status,
      canStart: status === 'OPEN',
      canResume: row.attempts[0]?.status === 'IN_PROGRESS' && status === 'OPEN',
      requiresPassword: row.passwordHash !== null,
      enableWebcam: row.enableWebcam,
      enableScreenMonitoring: row.enableScreenMonitoring,
    }
  })

  return { items, pagination: toPagination(query.page, query.pageSize, totalItems), statusCounts }
}

export async function getScores(studentId: string, query: StudentScoresQuery) {
  const attempts = await repo.listReleasedScores(studentId, query)
  const selectedByOriginalSchedule = new Map<string, typeof attempts[number]>()
  for (const attempt of attempts) {
    const originalScheduleId = attempt.examSchedule.makeupOfScheduleId ?? attempt.examSchedule.id
    const current = selectedByOriginalSchedule.get(originalScheduleId)
    const isMakeup = Boolean(attempt.examSchedule.makeupOfScheduleId)
    if (!current || (isMakeup && !current.examSchedule.makeupOfScheduleId)) {
      selectedByOriginalSchedule.set(originalScheduleId, attempt)
    }
  }
  const items = [...selectedByOriginalSchedule.values()]
    .map((attempt) => ({
      examId: attempt.examSchedule.id,
      attemptId: attempt.id,
      title: attempt.examSchedule.title,
      type: attempt.examSchedule.exam.type,
      score: Number(attempt.totalScore),
      publishedAt: attempt.examSchedule.resultsPublishedAt ?? attempt.examSchedule.publishedAt!,
      endedBy: attempt.endedBy,
      forceSubmitReason: attempt.endedBy === 'PROCTOR' ? attempt.forceSubmitReason : null,
      courseOfferingId: attempt.courseOffering.id,
      courseCode: attempt.courseOffering.code,
      subjectCode: attempt.courseOffering.subject.code,
      subjectName: attempt.courseOffering.subject.name,
    }))

  return { items }
}
