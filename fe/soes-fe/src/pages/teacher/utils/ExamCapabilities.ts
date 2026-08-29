import type { Exam } from '../types/teacher-exam.types'

export function getExamCapabilities(exam: Exam) {
  const hasStartedActivity = exam.schedules?.some(
    (schedule) => schedule.status === 'OPEN' || schedule.status === 'CLOSED',
  ) ?? false

  const isLockedFinalExam =
    exam.category === 'FINAL' &&
    (exam.status === 'PUBLISHED' || exam.status === 'PENDING_APPROVAL' || (exam.schedules?.length ?? 0) > 0)

  return {
    canEdit:
      !isLockedFinalExam &&
      (exam.status === 'DRAFT' || exam.status === 'REJECTED' || (exam.status === 'PUBLISHED' && !hasStartedActivity)),
    canDelete: exam.status === 'DRAFT' && (exam.schedules?.length ?? 0) === 0,
    canSchedule: exam.status === 'PUBLISHED' && exam.category !== 'FINAL' && !hasStartedActivity,
    canCopy: true,
    canToggleStudentVisibility: ['PUBLISHED', 'LOCKED'].includes(exam.status),
    lockReason: isLockedFinalExam
      ? 'Đề thi cuối kỳ đã được phê duyệt / đã gán ca thi tập trung.'
      : hasStartedActivity
        ? 'Đề đã có ca thi mở hoặc đã phát sinh bài làm.'
        : undefined,
  }
}
