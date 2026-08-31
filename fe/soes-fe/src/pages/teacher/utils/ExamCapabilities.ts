import type { Exam } from '../types/teacher-exam.types'

export function getExamCapabilities(exam: Exam) {
  const isLockedFinalExam =
    exam.category === 'FINAL' &&
    (exam.status === 'PUBLISHED' || exam.status === 'PENDING_APPROVAL' || (exam.schedules?.length ?? 0) > 0)

  return {
    canEdit: exam.capabilities?.canEdit ?? (
      !isLockedFinalExam &&
      (exam.status === 'DRAFT' || exam.status === 'REJECTED')),
    canDelete: exam.capabilities?.canDelete ?? (exam.status === 'DRAFT' && (exam.schedules?.length ?? 0) === 0),
    canSchedule: exam.capabilities?.canSchedule ?? (exam.status === 'PUBLISHED' && exam.category !== 'FINAL'),
    canLock: exam.capabilities?.canLock ?? (
      exam.status === 'PUBLISHED' && exam.category !== 'FINAL' && (exam.schedules?.length ?? 0) > 0),
    canUnlock: exam.capabilities?.canUnlock ?? (exam.status === 'LOCKED'),
    canCopy: exam.capabilities?.canCopy ?? true,
    canToggleStudentVisibility: ['PUBLISHED', 'LOCKED'].includes(exam.status),
    lockReason: isLockedFinalExam
      ? 'Đề thi cuối kỳ đã được phê duyệt / đã gán ca thi tập trung.'
      : exam.status === 'PUBLISHED'
        ? 'Đề đã công bố. Hãy sao chép thành bản nháp mới nếu cần chỉnh sửa nội dung.'
        : undefined,
  }
}
