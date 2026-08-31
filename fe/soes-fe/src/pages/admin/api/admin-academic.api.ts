import { apiClient } from '../../../api/axios'
import type { ApiPage, ApiResponse, SemesterApiDto, SemesterPayload } from '../types/admin-api.types'

const unwrap = <T>(response: { data: ApiResponse<T> }) => response.data.data

export const getSemesters = () =>
  apiClient.get<ApiResponse<ApiPage<SemesterApiDto>>>('/admin/semesters', {
    params: { page: 1, pageSize: 100 },
  }).then(unwrap)

export const createSemester = (payload: SemesterPayload) =>
  apiClient.post<ApiResponse<SemesterApiDto>>('/admin/semesters', payload).then(unwrap)

export const activateSemester = (id: string) =>
  apiClient.patch<ApiResponse<SemesterApiDto>>(`/admin/semesters/${id}/activate`).then(unwrap)
