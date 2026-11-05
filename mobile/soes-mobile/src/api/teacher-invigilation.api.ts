import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { InvigilationPage, InvigilationStatus } from '../types/teacher-invigilation.types'

export async function listInvigilation(page: number, keyword: string, status: InvigilationStatus | 'ALL') {
  const { data } = await apiClient.get<ApiResponse<InvigilationPage>>('/teacher/proctor-assignments', {
    params: { page, pageSize: 20, keyword: keyword.trim() || undefined, status: status === 'ALL' ? undefined : status },
  })
  return data.data
}

export async function listInvigilationMonth(month: Date) {
  const from = new Date(month.getFullYear(), month.getMonth(), 1).toISOString()
  const to = new Date(month.getFullYear(), month.getMonth() + 1, 1).toISOString()
  const items: InvigilationPage['items'] = []
  let page = 1
  let totalPages = 1
  do {
    const { data } = await apiClient.get<ApiResponse<InvigilationPage>>('/teacher/proctor-assignments', {
      params: { page, pageSize: 100, from, to },
    })
    items.push(...data.data.items)
    totalPages = data.data.pagination.totalPages
    page += 1
  } while (page <= totalPages)
  return items
}
