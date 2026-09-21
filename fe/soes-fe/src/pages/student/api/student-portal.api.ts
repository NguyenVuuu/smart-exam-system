import { apiClient } from '../../../api/axios'
import type { Pagination, ScoreItem } from '../types/course-detail.types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export interface StudentNotification {
  id: string
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export interface StudentExamSchedule {
  id: string
  title: string
  courseOfferingId: string
  courseCode: string
  subjectCode: string
  subjectName: string
  teacherName: string
  startTime: string
  endTime: string
  durationMinutes: number
  publishedAt: string
  attemptId: string | null
  status: 'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'
  canStart: boolean
  canResume: boolean
  requiresPassword: boolean
  enableWebcam: boolean
  enableScreenMonitoring: boolean
}

export interface StudentExamStatusCounts {
  OPEN: number
  UPCOMING: number
  COMPLETED: number
  EXPIRED: number
}

export interface StudentScore extends ScoreItem {
  courseOfferingId: string
  courseCode: string
  subjectCode: string
  subjectName: string
}

export function getStudentNotifications(params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) {
  return apiClient
    .get<ApiResponse<{ items: StudentNotification[]; pagination: Pagination }>>('/student/notifications', { params })
    .then(({ data }) => data.data)
}

export function markStudentNotificationRead(notificationId: string) {
  return apiClient.patch(`/student/notifications/${notificationId}/read`)
}

export function markAllStudentNotificationsRead() {
  return apiClient.patch('/student/notifications/read-all')
}

export function getStudentExamSchedules(params: {
  page?: number
  pageSize?: number
  status?: 'ALL' | 'OPEN' | 'UPCOMING' | 'COMPLETED' | 'EXPIRED'
  semesterId?: string
  keyword?: string
} = {}) {
  return apiClient
    .get<ApiResponse<{ items: StudentExamSchedule[]; pagination: Pagination; statusCounts: StudentExamStatusCounts }>>('/student/exam-schedules', { params })
    .then(({ data }) => data.data)
}

export function getStudentScores(params: {
  semesterId?: string
  courseOfferingId?: string
  keyword?: string
} = {}) {
  return apiClient
    .get<ApiResponse<{ items: StudentScore[] }>>('/student/scores', { params })
    .then(({ data }) => data.data)
}
