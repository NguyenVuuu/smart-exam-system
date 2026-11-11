import { apiClient } from '../../../api/axios'
import type { User } from '../../../types/auth.types'

interface ApiResponse<T> {
  data: T
}

export interface UpdateAccountProfilePayload {
  email: string | null
  phoneNumber: string | null
}

export interface ChangeAccountPasswordPayload {
  currentPassword: string
  newPassword: string
}

export async function updateAccountProfile(payload: UpdateAccountProfilePayload): Promise<User> {
  const response = await apiClient.patch<ApiResponse<User>>('/auth/me', payload)
  return response.data.data
}

export async function changeAccountPassword(payload: ChangeAccountPasswordPayload): Promise<void> {
  await apiClient.patch('/auth/me/password', payload)
}
