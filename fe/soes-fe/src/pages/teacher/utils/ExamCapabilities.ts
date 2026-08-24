import type { Exam } from '../types/teacher-exam.types'

export function getExamCapabilities(exam: Exam) {
  const hasStartedActivity = exam.schedules?.some(
    (schedule) => schedule.status === 'OPEN' || schedule.status === 'CLOSED',
  ) ?? false

  return {
    canEdit: exam.status === 'DRAFT' || exam.status === 'REJECTED' || (exam.status === 'PUBLISHED' && !hasStartedActivity),
    canDelete: exam.status === 'DRAFT' && (exam.schedules?.length ?? 0) === 0,
    canSchedule: exam.status === 'PUBLISHED' && exam.category !== 'FINAL' && !hasStartedActivity,
    canCopy: true,
    canToggleStudentVisibility: ['PUBLISHED', 'LOCKED'].includes(exam.status),
    lockReason: hasStartedActivity ? 'Đề đã có ca thi mở hoặc đã phát sinh bài làm.' : undefined,
  }
}
