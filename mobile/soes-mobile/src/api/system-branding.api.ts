import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'

export interface SystemBranding { logoUrl: string; shortName: string }

export async function getSystemBranding(): Promise<SystemBranding> {
  const { data } = await apiClient.get<ApiResponse<SystemBranding>>('/system-settings/public')
  return data.data
}
