import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { QuestionApprovalPage } from '../types/teacher-question-approvals.types'

export const listPendingQuestionApprovals = async (page: number) =>
  (await apiClient.get<ApiResponse<QuestionApprovalPage>>('/teacher/question-approvals', { params: { status: 'PENDING', page, pageSize: 20 } })).data.data
export const approveQuestion = (id: string) => apiClient.post(`/teacher/question-approvals/${id}/approve`)
export const rejectQuestion = (id: string, reason: string) => apiClient.post(`/teacher/question-approvals/${id}/reject`, { reason })
