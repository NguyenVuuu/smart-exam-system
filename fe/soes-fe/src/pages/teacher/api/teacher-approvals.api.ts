import { apiClient } from '../../../api/axios'
import type { TeacherExamDto } from '../types/teacher-exam-api.types'
import type { TeacherQuestionDto } from '../types/teacher-question-api.types'

interface ApiResponse<T> { success: boolean; data: T }
interface QuestionApprovalDto { id: string; question: TeacherQuestionDto }

export async function getPendingQuestionApprovals() {
  const response = await apiClient.get<ApiResponse<{ items: QuestionApprovalDto[] }>>('/teacher/question-approvals', {
    params: { status: 'PENDING', page: 1, pageSize: 100 },
  })
  return response.data.data.items
}

export async function getPendingExamApprovals() {
  const response = await apiClient.get<ApiResponse<{ items: TeacherExamDto[] }>>('/teacher/exam-approvals', {
    params: { status: 'PENDING', page: 1, pageSize: 100 },
  })
  return response.data.data.items
}

const post = (path: string, data?: unknown) => apiClient.post(path, data)
export const approveQuestion = (id: string) => post(`/teacher/question-approvals/${id}/approve`)
export const rejectQuestion = (id: string, reason: string) => post(`/teacher/question-approvals/${id}/reject`, { reason })
export const approveExam = (id: string) => post(`/teacher/exam-approvals/${id}/approve`)
export const rejectExam = (id: string, reason: string) => post(`/teacher/exam-approvals/${id}/reject`, { reason })
