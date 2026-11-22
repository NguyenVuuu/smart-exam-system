import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ProctoringViolation } from '../types/teacher-proctoring.types'

export async function listLiveProctoringViolations(scheduleId: string) {
  const { data } = await apiClient.get<ApiResponse<{ items: ProctoringViolation[] }>>(`/teacher/proctoring/schedules/${scheduleId}/violations`, { params: { page: 1, pageSize: 100 } })
  return data.data.items
}

