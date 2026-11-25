import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ApprovalPage, ExamApprovalDetail, QuestionRevisionNote, ReviewHistoryItem } from '../types/teacher-approvals.types'

export async function listExamApprovals(page: number, status: 'PENDING' | 'APPROVED') {
  const { data } = await apiClient.get<ApiResponse<ApprovalPage>>('/teacher/exam-approvals', { params: { status, page, pageSize: 20 } })
  return data.data
}
export const listPendingExamApprovals = (page: number) => listExamApprovals(page, 'PENDING')
export const listApprovedExamApprovals = (page: number) => listExamApprovals(page, 'APPROVED')
export async function getExamApproval(id: string) {
  const { data } = await apiClient.get<ApiResponse<ExamApprovalDetail>>(`/teacher/exam-approvals/${id}`)
  return data.data
}
export const approveExam = (id: string) => apiClient.post(`/teacher/exam-approvals/${id}/approve`)
export const requestExamRevision = (id: string, reason: string, questionNotes: QuestionRevisionNote[]) =>
  apiClient.post(`/teacher/exam-approvals/${id}/reject`, { reason: reason.trim() || undefined, questionNotes })

export async function getExamReviewHistory(id: string) {
  const { data } = await apiClient.get<ApiResponse<ReviewHistoryItem[]>>(`/teacher/exams/${id}/review-history`)
  return data.data
}
