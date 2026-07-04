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
  date: string
  time: string
  status: 'soon' | 'normal'
}

export type NotificationDotColor = 'green' | 'yellow' | 'red'

export interface NotificationItem {
  id: string
  message: string
  dot: NotificationDotColor
}

export type SemesterOption = { value: string; label: string }
export type ScoreTypeOption = { value: string; label: string }
