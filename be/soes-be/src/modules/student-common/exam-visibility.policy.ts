import { ExamScheduleStatus, ExamStatus, type Prisma } from '@prisma/client'

export const STUDENT_VISIBLE_EXAM_STATUSES: ExamStatus[] = [
  ExamStatus.READY,
  ExamStatus.LOCKED,
]

export const STUDENT_VISIBLE_SCHEDULE_STATUSES: ExamScheduleStatus[] = [
  ExamScheduleStatus.SCHEDULED,
  ExamScheduleStatus.OPEN,
  ExamScheduleStatus.CLOSED,
]

export const STUDENT_UPCOMING_SCHEDULE_STATUSES: ExamScheduleStatus[] = [
  ExamScheduleStatus.SCHEDULED,
]

export const STUDENT_STARTABLE_SCHEDULE_STATUSES: ExamScheduleStatus[] = [
  ExamScheduleStatus.SCHEDULED,
  ExamScheduleStatus.OPEN,
]

export function studentVisibleExamWhere(): Prisma.ExamWhereInput {
  return {
    status: { in: STUDENT_VISIBLE_EXAM_STATUSES },
  }
}

export function studentVisibleScheduleWhere(
  statuses: ExamScheduleStatus[] = STUDENT_VISIBLE_SCHEDULE_STATUSES,
): Prisma.ExamScheduleWhereInput {
  return {
    publishedAt: { not: null },
    status: { in: statuses },
    exam: studentVisibleExamWhere(),
  }
}
