import type {
  DashboardAnalyticsItemDto,
  DashboardNotificationDto,
  DashboardUpcomingExamDto,
} from '../dtos/student-dashboard.dto'

interface ExamRow {
  id: string
  title: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  status: string
  courseOffering: { subject: { name: string } }
}

interface NotificationRow {
  id: string
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

export function toUpcomingExamDto(exam: ExamRow): DashboardUpcomingExamDto {
  return {
    id: exam.id,
    title: exam.title,
    subjectName: exam.courseOffering.subject.name,
    startTime: exam.startTime,
    endTime: exam.endTime,
    durationMinutes: exam.durationMinutes,
  }
}

export function toNotificationDto(notif: NotificationRow): DashboardNotificationDto {
  return {
    id: notif.id,
    title: notif.title,
    content: notif.content,
    isRead: notif.isRead,
    createdAt: notif.createdAt,
  }
}

export function toAnalyticsItemDto(
  subjectName: string,
  myScore: number,
  classAverage: number,
): DashboardAnalyticsItemDto {
  return {
    subjectName,
    myScore: Math.round(myScore * 100) / 100,
    classAverage: Math.round(classAverage * 100) / 100,
  }
}
