import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ApprovalPage, ExamApprovalDetail, QuestionRevisionNote } from '../types/teacher-approvals.types'

export async function listPendingExamApprovals(page: number) {
  const { data } = await apiClient.get<ApiResponse<ApprovalPage>>('/teacher/exam-approvals', { params: { status: 'PENDING', page, pageSize: 20 } })
  return data.data
}
export async function getExamApproval(id: string) {
  const { data } = await apiClient.get<ApiResponse<ExamApprovalDetail>>(`/teacher/exam-approvals/${id}`)
  return data.data
}
export const approveExam = (id: string) => apiClient.post(`/teacher/exam-approvals/${id}/approve`)
export const requestExamRevision = (id: string, questionNotes: QuestionRevisionNote[]) =>
  apiClient.post(`/teacher/exam-approvals/${id}/reject`, { questionNotes })
