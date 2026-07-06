import type {
  DashboardAnalyticsItemDto,
  DashboardNotificationDto,
  DashboardUpcomingExamDto,
  ExamTypeValue,
} from '../dtos/student-dashboard.dto'

interface UpcomingExamRow {
  id: string
  title: string
  startTime: Date
  endTime: Date
  durationMinutes: number
  courseOffering: { subject: { name: string } }
}

interface NotificationRow {
  id: string
  title: string
  content: string
  isRead: boolean
  createdAt: Date
}

export function toUpcomingExamDto(
  exam: UpcomingExamRow,
): DashboardUpcomingExamDto {
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

export function toAnalyticsItemDto(params: {
  subjectId: string
  subjectName: string
  semesterId: string
  semesterName: string
  examType: ExamTypeValue
  myScore: number
  classAverage: number
}): DashboardAnalyticsItemDto {
  return {
    subjectId: params.subjectId,
    subjectName: params.subjectName,
    semesterId: params.semesterId,
    semesterName: params.semesterName,
    examType: params.examType,
    myScore: Math.round(params.myScore * 100) / 100,
    classAverage: Math.round(params.classAverage * 100) / 100,
  }
}
