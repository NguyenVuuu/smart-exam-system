import { apiClient } from '../../../api/axios'
import type { User } from '../../../types/auth.types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function updateStudentContact(payload: {
  email: string | null
  phoneNumber: string | null
}): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>('/auth/me', payload)
  return data.data
}

export async function changeStudentPassword(payload: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  await apiClient.patch('/auth/me/password', payload)
}
