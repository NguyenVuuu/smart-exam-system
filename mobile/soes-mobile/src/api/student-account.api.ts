import { apiClient } from './client'
import type { ApiResponse, User } from '../types/auth.types'

export async function getStudentProfile(): Promise<User> {
  const { data } = await apiClient.get<ApiResponse<User>>('/auth/me')
  return data.data
}

export async function saveStudentProfile(email: string, phoneNumber: string): Promise<User> {
  const { data } = await apiClient.patch<ApiResponse<User>>('/auth/me', {
    email: email.trim() || null,
    phoneNumber: phoneNumber.trim() || null,
  })
  return data.data
}

export async function changeStudentPassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.patch('/auth/me/password', { currentPassword, newPassword })
}
