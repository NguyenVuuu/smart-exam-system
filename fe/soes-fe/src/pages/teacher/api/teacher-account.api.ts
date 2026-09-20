import { apiClient } from '../../../api/axios'
import type { User } from '../../../types/auth.types'

interface ApiResponse<T> {
  data: T
}

export interface UpdateTeacherProfilePayload {
  email: string | null
  phoneNumber: string | null
}

export interface ChangeTeacherPasswordPayload {
  currentPassword: string
  newPassword: string
}

export async function updateTeacherProfile(payload: UpdateTeacherProfilePayload): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>('/auth/me', payload)
  return response.data.data
}

export async function changeTeacherPassword(payload: ChangeTeacherPasswordPayload): Promise<void> {
  await apiClient.patch('/auth/me/password', payload)
}
