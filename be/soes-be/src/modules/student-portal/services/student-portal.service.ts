import { NotFoundError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import type { StudentExamSchedulesQuery, StudentScoresQuery, NotificationsQuery } from '../validators/student-portal.validator'
import * as repo from '../repositories/student-portal.repository'
import { findReleasedScorePage } from '../repositories/score-page.repository'
import { calculateAverageScore } from './score-summary'
import { findVisibleSchedulePage } from '../repositories/schedule-page.repository'

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
  const now = new Date()
  const page = await findVisibleSchedulePage(studentId, query, now)
  const rows = page.ids.length ? await repo.listVisibleSchedules(studentId, query, page.ids) : []
  const byId = new Map(rows.map(row => [row.id, row]))
  const items = page.ids.flatMap(id => {
    const row = byId.get(id)
    if (!row) return []
    const status = examStatus(row, now)
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

  return { items, pagination: toPagination(query.page, query.pageSize, page.total), statusCounts: page.statusCounts }
}

export async function getScores(studentId: string, query: StudentScoresQuery) {
  const page = query.page !== undefined || query.pageSize !== undefined
    ? await findReleasedScorePage(studentId, query) : undefined
  const attempts = page?.ids.length === 0 ? [] : await repo.listReleasedScores(studentId, query, page?.ids)
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

  if (!page) return { items }
  const byId = new Map(items.map(item => [item.attemptId, item]))
  return {
    items: page.ids.flatMap(id => { const item = byId.get(id); return item ? [item] : [] }),
    pagination: toPagination(query.page ?? 1, query.pageSize ?? 20, page.total),
    averageScore: calculateAverageScore(page.summary), highestScore: page.highestScore,
  }
}
