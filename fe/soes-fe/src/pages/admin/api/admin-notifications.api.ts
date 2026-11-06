import { apiClient } from '../../../api/axios'
import type { TeacherNotificationPage } from '../../teacher/api/teacher-notifications.api'

export async function getAdminNotifications() {
  const { data } = await apiClient.get<{ data: TeacherNotificationPage }>('/notifications', {
    params: { page: 1, pageSize: 8 },
  })
  return data.data
}

export function markAdminNotificationRead(id: string) {
  return apiClient.patch(`/notifications/${id}/read`)
}

export function markAllAdminNotificationsRead() {
  return apiClient.patch('/notifications/read-all')
}
