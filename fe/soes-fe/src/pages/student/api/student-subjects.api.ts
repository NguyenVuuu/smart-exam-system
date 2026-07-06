import { apiClient } from '../../../api/axios'
import type { StudentSubjectsResponse } from '../types/subjects.types'

export interface GetSubjectsParams {
  page?: number
  pageSize?: number
  semesterId?: string
  keyword?: string
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

export async function getStudentSubjects(
  params: GetSubjectsParams,
): Promise<StudentSubjectsResponse> {
  const { data } = await apiClient.get<ApiResponse<StudentSubjectsResponse>>(
    '/student/subjects',
    { params },
  )
  return data.data
}
