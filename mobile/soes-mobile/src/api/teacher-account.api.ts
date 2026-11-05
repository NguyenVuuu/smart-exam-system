import { apiClient } from './client'
import type { ApiResponse, User } from '../types/auth.types'

export async function getTeacherProfile() {
  const { data } = await apiClient.get<ApiResponse<User>>('/auth/me')
  return data.data
}
export async function saveTeacherProfile(email: string, phoneNumber: string) {
  const { data } = await apiClient.patch<ApiResponse<User>>('/auth/me', { email: email.trim() || null, phoneNumber: phoneNumber.trim() || null })
  return data.data
}
export async function changeTeacherPassword(currentPassword: string, newPassword: string) {
  await apiClient.patch('/auth/me/password', { currentPassword, newPassword })
}
