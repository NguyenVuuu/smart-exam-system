import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { TeacherNotificationsPage } from '../types/teacher-notifications.types'

export async function listTeacherNotifications(page: number) {
  const { data } = await apiClient.get<ApiResponse<TeacherNotificationsPage>>('/teacher/notifications', { params: { page, pageSize: 20 } })
  return data.data
}

export async function readTeacherNotification(id: string) { await apiClient.patch(`/teacher/notifications/${id}/read`) }
export async function readAllTeacherNotifications() { await apiClient.patch('/teacher/notifications/read-all') }
