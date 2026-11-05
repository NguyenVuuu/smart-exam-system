import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { InvigilationPage, InvigilationStatus } from '../types/teacher-invigilation.types'

export async function listInvigilation(page: number, keyword: string, status: InvigilationStatus | 'ALL') {
  const { data } = await apiClient.get<ApiResponse<InvigilationPage>>('/teacher/proctor-assignments', {
    params: { page, pageSize: 20, keyword: keyword.trim() || undefined, status: status === 'ALL' ? undefined : status },
  })
  return data.data
}
