import type {
  NotificationItem,
  ScoreEntry,
  SemesterOption,
  ScoreTypeOption,
  StatCard,
  UpcomingExam,
} from '../types/dashboard.types'

export const STAT_CARDS: StatCard[] = [
  { label: 'Môn học', value: 5, icon: 'subject' },
  { label: 'Bài thi', value: 8, icon: 'exam' },
  { label: 'GPA HK', value: '8.42', icon: 'gpa' },
  { label: 'Sắp diễn ra', value: 2, icon: 'upcoming' },
]

export const SEMESTER_OPTIONS: SemesterOption[] = [
  { value: 'hk1-2026', label: 'HK1 2026' },
  { value: 'hk2-2025', label: 'HK2 2025' },
  { value: 'hk1-2025', label: 'HK1 2025' },
]

export const SCORE_TYPE_OPTIONS: ScoreTypeOption[] = [
  { value: 'midterm', label: 'Giữa kỳ' },
  { value: 'final', label: 'Cuối kỳ' },
]

export const SCORE_DATA: Record<string, Record<string, ScoreEntry[]>> = {
  'hk1-2026': {
    midterm: [
      { subject: 'Java', studentScore: 8.5, classAverage: 7.3 },
      { subject: 'SQL', studentScore: 9.2, classAverage: 7.5 },
      { subject: 'React', studentScore: 9.1, classAverage: 8.2 },
      { subject: 'AI', studentScore: 9.3, classAverage: 8.4 },
      { subject: 'CNPM', studentScore: 9.0, classAverage: 7.6 },
    ],
    final: [
      { subject: 'Java', studentScore: 8.0, classAverage: 7.1 },
      { subject: 'SQL', studentScore: 8.8, classAverage: 7.4 },
      { subject: 'React', studentScore: 8.5, classAverage: 7.9 },
      { subject: 'AI', studentScore: 9.0, classAverage: 8.0 },
      { subject: 'CNPM', studentScore: 8.2, classAverage: 7.3 },
    ],
  },
  'hk2-2025': {
    midterm: [
      { subject: 'OOP', studentScore: 7.8, classAverage: 7.0 },
      { subject: 'CSDL', studentScore: 8.4, classAverage: 7.6 },
      { subject: 'MMT', studentScore: 8.0, classAverage: 7.2 },
    ],
    final: [
      { subject: 'OOP', studentScore: 8.2, classAverage: 7.5 },
      { subject: 'CSDL', studentScore: 8.0, classAverage: 7.3 },
      { subject: 'MMT', studentScore: 7.6, classAverage: 6.9 },
    ],
  },
  'hk1-2025': {
    midterm: [
      { subject: 'Toán', studentScore: 7.5, classAverage: 6.8 },
      { subject: 'Lý', studentScore: 8.0, classAverage: 7.1 },
    ],
    final: [
      { subject: 'Toán', studentScore: 7.0, classAverage: 6.5 },
      { subject: 'Lý', studentScore: 7.8, classAverage: 6.9 },
    ],
  },
}

export const UPCOMING_EXAMS: UpcomingExam[] = [
  { id: '1', title: 'SQL Quiz', date: '17/07', time: '13:30', status: 'soon' },
  { id: '2', title: 'Java Final', date: '20/07', time: '08:00', status: 'normal' },
]

export const NOTIFICATIONS: NotificationItem[] = [
  { id: '1', message: 'Có điểm Java', dot: 'green' },
  { id: '2', message: 'Có bài thi mới', dot: 'yellow' },
  { id: '3', message: 'Giảng viên đăng tài liệu', dot: 'red' },
]
