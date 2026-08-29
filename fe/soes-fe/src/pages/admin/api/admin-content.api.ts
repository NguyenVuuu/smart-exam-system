import { apiClient } from '../../../api/axios'
import type { AdminExamTrackingApiDto, AdminQuestionBankApiDto, ApiPage, ApiResponse } from '../types/admin-api.types'

export interface ContentListParams {
  page: number; pageSize: number; keyword?: string; departmentId?: string; subjectId?: string; status?: string
}
export interface ExamTrackingParams extends ContentListParams {
  type?: string; approvalStatus?: string
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
