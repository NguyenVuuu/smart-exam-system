import type { StudentExamSchedule } from '../../api/student-portal.api'

export type StudentExamItem = StudentExamSchedule
export type StudentExamFilter = 'ALL' | StudentExamItem['status']
export type StudentExamViewMode = 'CALENDAR' | 'LIST'

export interface StudentCalendarDay {
  date: Date
  dateString: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  exams: StudentExamItem[]
}

export const STUDENT_EXAM_FILTERS: Array<{
  value: StudentExamFilter
  label: string
}> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'OPEN', label: 'Đang mở' },
  { value: 'UPCOMING', label: 'Sắp diễn ra' },
  { value: 'COMPLETED', label: 'Đã hoàn thành' },
  { value: 'EXPIRED', label: 'Đã quá hạn' },
]

export const STUDENT_EXAM_WEEKDAYS = [
  'THỨ 2',
  'THỨ 3',
  'THỨ 4',
  'THỨ 5',
  'THỨ 6',
  'THỨ 7',
  'CHỦ NHẬT',
]
