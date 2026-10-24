import { apiClient } from '../../../api/axios'
import type { TeacherExamDto } from '../types/teacher-exam-api.types'
import type { TeacherQuestionDto } from '../types/teacher-question-api.types'

interface ApiResponse<T> { success: boolean; data: T }
interface QuestionApprovalDto { id: string; question: TeacherQuestionDto }

export interface ExamApprovalDto extends TeacherExamDto {
  reviewRound: { id: string; version: number; status: 'PENDING' | 'APPROVED' | 'REVISION_REQUESTED'; submittedAt: string }
}

export interface ExamReviewSnapshot {
  id: string
  title: string
  description: string | null
  type: 'FINAL'
  format: TeacherExamDto['format']
  defaultDurationMinutes: number
  totalPoints: number | string
  sections: Array<{ id: string; title: string; description: string | null; type: 'OBJECTIVE' | 'PROGRAMMING'; targetPoints: number | string; orderIndex: number }>
  examQuestions: Array<{
    id: string; sourceQuestionId: string | null; sectionId: string | null; orderIndex: number
    points: number | string; title: string; content: string; explanation: string | null
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'; language: 'JAVA' | 'C' | 'CPP' | null
    options: Array<{ id: string; content: string; isCorrect: boolean }>
    programmingConfig: { timeLimitMs: number; memoryLimitKb: number; maxCodeSizeKb: number } | null
    programmingTests: Array<{ id: string; input: string; expectedOutput: string; isHidden: boolean }>
  }>
}

export interface ExamApprovalDetailDto extends ExamApprovalDto {
  snapshot: ExamReviewSnapshot
}

export async function getPendingQuestionApprovals() {
  const response = await apiClient.get<ApiResponse<{ items: QuestionApprovalDto[] }>>('/teacher/question-approvals', {
    params: { status: 'PENDING', page: 1, pageSize: 100 },
  })
  return response.data.data.items
}

export async function getPendingExamApprovals() {
  const response = await apiClient.get<ApiResponse<{ items: ExamApprovalDto[] }>>('/teacher/exam-approvals', {
    params: { status: 'PENDING', page: 1, pageSize: 100 },
  })
  return response.data.data.items
}

export async function getExamApprovalDetail(id: string) {
  const response = await apiClient.get<ApiResponse<ExamApprovalDetailDto>>(`/teacher/exam-approvals/${id}`)
  return response.data.data
}

const post = (path: string, data?: unknown) => apiClient.post(path, data)
export const approveQuestion = (id: string) => post(`/teacher/question-approvals/${id}/approve`)
export const rejectQuestion = (id: string, reason: string) => post(`/teacher/question-approvals/${id}/reject`, { reason })
export const approveExam = (id: string) => post(`/teacher/exam-approvals/${id}/approve`)
export const rejectExam = (id: string, reason: string) => post(`/teacher/exam-approvals/${id}/reject`, { reason })
