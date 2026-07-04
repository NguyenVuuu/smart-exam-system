export interface DashboardGreetingDto {
  fullName: string
}

export interface DashboardStatsDto {
  subjectCount: number
  examCount: number
  gpa: number | null
  upcomingExamCount: number
}

export interface DashboardAnalyticsItemDto {
  subjectName: string
  myScore: number
  classAverage: number
}

export interface DashboardUpcomingExamDto {
  id: string
  title: string
  subjectName: string
  startTime: Date
  endTime: Date
  durationMinutes: number
}

export interface DashboardNotificationDto {
  id: string
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

export interface StudentDashboardDto {
  greeting: DashboardGreetingDto
  stats: DashboardStatsDto
  analytics: DashboardAnalyticsItemDto[]
  upcomingExams: DashboardUpcomingExamDto[]
  notifications: DashboardNotificationDto[]
}
