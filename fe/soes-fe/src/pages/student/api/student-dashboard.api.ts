import { apiClient } from '../../../api/axios'
import type { DashboardApiResponse } from '../types/dashboard.types'

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function getDashboard(): Promise<DashboardApiResponse> {
  const { data } = await apiClient.get<ApiResponse<DashboardApiResponse>>('/student/dashboard')
  return data.data
}
