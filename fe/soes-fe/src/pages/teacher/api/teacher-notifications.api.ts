import { apiClient } from '../../../api/axios'

interface ApiResponse<T> {
  success: boolean
  data: T
}

export interface TeacherNotification {
  id: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
}

export interface TeacherNotificationPage {
  items: TeacherNotification[]
  unreadCount: number
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
}

export function getTeacherNotifications(pageSize = 8) {
  return apiClient
    .get<ApiResponse<TeacherNotificationPage>>('/teacher/notifications', { params: { page: 1, pageSize } })
    .then(({ data }) => data.data)
}

export function markTeacherNotificationRead(notificationId: string) {
  return apiClient.patch(`/teacher/notifications/${notificationId}/read`)
}

export function markAllTeacherNotificationsRead() {
  return apiClient.patch('/teacher/notifications/read-all')
}
