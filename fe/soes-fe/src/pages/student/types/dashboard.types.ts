// ── UI component prop types ───────────────────────────────

export interface StatCard {
  label: string
  value: string | number
  icon: 'subject' | 'exam' | 'gpa' | 'upcoming'
}

export interface ScoreEntry {
  subject: string
  studentScore: number
  classAverage: number
}

export interface UpcomingExam {
  id: string
  title: string
  date: string   // formatted e.g. "17/07"
  time: string   // formatted e.g. "13:30"
  status: 'soon' | 'normal'
}

export type NotificationDotColor = 'green' | 'yellow' | 'red'

export interface NotificationItem {
  id: string
  message: string
  dot: NotificationDotColor
}

export type SelectOption = { value: string; label: string }

export type ExamType = 'QUIZ' | 'MIDTERM' | 'FINAL'

// Extended ScoreEntry used by the analytics hook (carries filter metadata)
export interface AnalyticsItem {
  subjectId: string
  subjectName: string
  semesterId: string
  semesterName: string
  examType: ExamType
  myScore: number
  classAverage: number
}

// ── API response types ────────────────────────────────────

export interface DashboardApiResponse {
  greeting: { fullName: string }
  stats: {
    subjectCount: number
    examCount: number
    gpa: number | null
    upcomingExamCount: number
  }
  analytics: Array<{
    subjectId: string
    subjectName: string
    semesterId: string
    semesterName: string
    examType: 'QUIZ' | 'MIDTERM' | 'FINAL'
    myScore: number
    classAverage: number
  }>
  upcomingExams: Array<{
    id: string
    title: string
    subjectName: string
    startTime: string
    endTime: string
    durationMinutes: number
  }>
  notifications: Array<{
    id: string
    title: string
    content: string
    isRead: boolean
    createdAt: string
  }>
}
