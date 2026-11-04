import { apiClient } from './client'
import type { ExamType } from '../types/course-detail.types'
import type { Pagination } from '../types/subjects.types'

interface ApiResponse<T> { success: boolean; message: string; data: T }

// ── Notifications ─────────────────────────────────────────────────────────────

export interface StudentNotification {
  id: string
  title: string
  content: string
  link: string | null
  isRead: boolean
  createdAt: string
}

export async function getStudentNotifications(params: {
  page?: number; pageSize?: number; unreadOnly?: boolean
} = {}): Promise<{ items: StudentNotification[]; pagination: Pagination }> {
  const { data } = await apiClient.get<ApiResponse<{ items: StudentNotification[]; pagination: Pagination }>>(
    '/student/notifications', { params },
  )
  return data.data
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.patch(`/student/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await apiClient.patch('/student/notifications/read-all')
}

// ── Scores ────────────────────────────────────────────────────────────────────

export interface StudentScore {
  examId: string
  attemptId: string
  title: string
  type: ExamType
  score: number
  publishedAt: string
  courseOfferingId: string
  courseCode: string
  subjectCode: string
  subjectName: string
}

export async function getStudentScores(params: {
  semesterId?: string; courseOfferingId?: string; keyword?: string
} = {}): Promise<{ items: StudentScore[] }> {
  const { data } = await apiClient.get<ApiResponse<{ items: StudentScore[] }>>(
    '/student/scores', { params },
  )
  return data.data
}
