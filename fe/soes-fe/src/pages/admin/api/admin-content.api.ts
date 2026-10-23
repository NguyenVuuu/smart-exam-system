import { apiClient } from '../../../api/axios'
import type { AdminExamTrackingApiDto, AdminQuestionBankApiDto, ApiPage, ApiResponse } from '../types/admin-api.types'
import type { TeacherExamDetailDto } from '../../teacher/types/teacher-exam-api.types'

export type AdminExamDetail = Pick<TeacherExamDetailDto, 'id' | 'questions'>
export const getAdminExamDetail = (id: string) => apiClient
  .get<ApiResponse<AdminExamDetail>>(`/admin/exam-tracking/${id}`).then(({ data }) => data.data)

export interface ContentListParams {
  page: number; pageSize: number; keyword?: string; departmentId?: string; subjectId?: string; status?: string
}
export interface ExamTrackingParams extends ContentListParams {
  type?: string; approvalStatus?: string; semesterId?: string
}

const unwrap = <T>({ data }: { data: ApiResponse<T> }) => data.data
export const getAdminQuestionBank = (params: ContentListParams) =>
  apiClient.get<ApiResponse<ApiPage<AdminQuestionBankApiDto>>>('/admin/shared-question-bank', { params }).then(unwrap)
export const removeAdminQuestion = (id: string, reason: string) =>
  apiClient.post<ApiResponse<{ id: string; removed: boolean }>>(`/admin/shared-question-bank/${id}/remove`, { reason }).then(unwrap)
export const restoreAdminQuestion = (id: string) =>
  apiClient.post<ApiResponse<{ id: string; restored: boolean }>>(`/admin/shared-question-bank/${id}/restore`).then(unwrap)
export const getAdminExamTracking = (params: ExamTrackingParams) =>
  apiClient.get<ApiResponse<ApiPage<AdminExamTrackingApiDto>>>('/admin/exam-tracking', { params }).then(unwrap)
