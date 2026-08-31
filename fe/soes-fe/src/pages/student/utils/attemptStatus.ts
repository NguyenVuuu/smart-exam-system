import type { AttemptStatus } from '../api/student-take-exam.api'

export const completedAttemptStatuses: AttemptStatus['status'][] = [
  'SUBMITTED',
  'AUTO_SUBMITTED',
  'GRADING',
  'GRADED',
  'PUBLISHED',
]

export function isCompletedAttemptStatus(status: AttemptStatus['status']) {
  return completedAttemptStatuses.includes(status)
}

export function getAttemptStatusLabel(status: AttemptStatus['status'] | undefined) {
  switch (status) {
    case 'IN_PROGRESS':
      return 'Đang làm bài'
    case 'SUBMITTED':
      return 'Đã nộp bài'
    case 'AUTO_SUBMITTED':
      return 'Tự động nộp'
    case 'GRADING':
      return 'Đang chấm'
    case 'GRADED':
      return 'Đã chấm'
    case 'PUBLISHED':
      return 'Đã công bố điểm'
    case 'EXPIRED':
      return 'Hết thời gian'
    case 'INVALIDATED':
      return 'Bài thi bị hủy'
    default:
      return status ?? '—'
  }
}

export function getAttemptEndedByLabel(value: AttemptStatus['endedBy'] | undefined) {
  switch (value) {
    case 'STUDENT':
      return 'Sinh viên'
    case 'TIMEOUT':
      return 'Hết giờ'
    case 'SYSTEM':
      return 'Hệ thống'
    default:
      return '—'
  }
}
