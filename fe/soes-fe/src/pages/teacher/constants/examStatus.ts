import type { ExamStatus } from '../types/teacher-exam.types'

export const examStatusTone: Record<ExamStatus, 'amber' | 'blue' | 'rose' | 'emerald' | 'gray'> = {
  DRAFT: 'amber', PENDING_APPROVAL: 'blue', REJECTED: 'rose',
  PUBLISHED: 'emerald', LOCKED: 'gray', ARCHIVED: 'gray',
}

export const examStatusLabel: Record<ExamStatus, string> = {
  DRAFT: 'Bản nháp', PENDING_APPROVAL: 'Chờ duyệt', REJECTED: 'Bị từ chối',
  PUBLISHED: 'Đã công bố', LOCKED: 'Đã chốt lịch thi', ARCHIVED: 'Đã lưu trữ',
}
