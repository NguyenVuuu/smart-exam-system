import type { ExamScheduleStatus, Prisma } from '@prisma/client'
import type { ExamScheduleDto } from '../dtos/exam-schedule.dto'
import type { scheduleInclude } from '../repositories/exam-schedule.repository'

type ScheduleRow = Prisma.ExamScheduleGetPayload<{ include: typeof scheduleInclude }>

export function computeScheduleStatus(
  status: ExamScheduleStatus,
  startTime: Date,
  endTime: Date,
): ExamScheduleStatus {
  if (status === 'CANCELLED' || status === 'DRAFT') return status
  const now = new Date()
  const start = new Date(startTime)
  const end = new Date(endTime)
  if (now < start) return 'SCHEDULED'
  if (now >= start && now < end) return 'OPEN'
  return 'CLOSED'
}

export function toExamScheduleDto(row: ScheduleRow): ExamScheduleDto {
  return {
    id: row.id, title: row.title, startTime: row.startTime, endTime: row.endTime,
    durationMinutes: row.durationMinutes, maxAttempts: row.maxAttempts,
    status: computeScheduleStatus(row.status, row.startTime, row.endTime),
    locationMode: row.locationMode, distributionMode: row.distributionMode,
    resultReleaseMode: row.resultReleaseMode, reviewPolicy: row.reviewPolicy,
    attemptCount: row._count.attempts, hasPassword: Boolean(row.passwordHash), exam: row.exam,
    enableTabLock: row.enableTabLock, maxTabSwitches: row.maxTabSwitches,
    requireFullscreen: row.requireFullscreen, enableWebcam: row.enableWebcam,
    blockCopyPaste: row.blockCopyPaste, blockRightClick: row.blockRightClick,
    allowedIpRanges: row.allowedIpRanges, randomQuestionCount: row.randomQuestionCount,
    resultReleaseAt: row.resultReleaseAt, reviewStartAt: row.reviewStartAt, reviewEndAt: row.reviewEndAt,
    courses: row.scheduleCourses.map(({ courseOffering, proctors }) => ({
      id: courseOffering.id, code: courseOffering.code,
      proctors: proctors.map(({ teacher }) => ({ id: teacher.id, code: teacher.teacherCode, fullName: teacher.user.fullName })),
    })),
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  }
}
