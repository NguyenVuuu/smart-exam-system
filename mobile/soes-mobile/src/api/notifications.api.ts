import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'

export async function getUnreadNotificationCount() {
  const { data } = await apiClient.get<ApiResponse<{ unreadCount: number }>>('/notifications', {
    params: { page: 1, pageSize: 1 },
  })
  return data.data.unreadCount
}
