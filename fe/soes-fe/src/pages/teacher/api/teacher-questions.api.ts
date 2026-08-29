import { apiClient } from '../../../api/axios'
import type { QuestionPayload, TeacherQuestionDto, TeacherSubjectOption } from '../types/teacher-question-api.types'

interface ApiResponse<T> { success: boolean; data: T }
interface QuestionList {
  items: TeacherQuestionDto[]
  pagination: { page: number; totalPages: number }
}

async function listPage(scope: 'PERSONAL' | 'SHARED', archived: boolean, page: number) {
  const response = await apiClient.get<ApiResponse<QuestionList>>('/teacher/questions', {
    params: { scope, archived: String(archived), page, pageSize: 100 },
  })
  return response.data.data
}

async function listAll(scope: 'PERSONAL' | 'SHARED', archived = false) {
  const first = await listPage(scope, archived, 1)
  const remaining = await Promise.all(
    Array.from({ length: Math.max(0, first.pagination.totalPages - 1) }, (_, index) =>
      listPage(scope, archived, index + 2)),
  )
  return [first, ...remaining].flatMap(({ items }) => items)
}

export const getPersonalQuestions = () => listAll('PERSONAL')
export const getArchivedQuestions = () => listAll('PERSONAL', true)
export const getSharedQuestions = () => listAll('SHARED')

export async function getQuestionSubjects() {
  const response = await apiClient.get<ApiResponse<TeacherSubjectOption[]>>('/teacher/question-subjects')
  return response.data.data
}

export async function createQuestion(payload: QuestionPayload) {
  const response = await apiClient.post<ApiResponse<TeacherQuestionDto>>('/teacher/questions', payload)
  return response.data.data
}

export async function updateQuestion(id: string, payload: QuestionPayload) {
  const response = await apiClient.put<ApiResponse<TeacherQuestionDto>>(`/teacher/questions/${id}`, payload)
  return response.data.data
}

const postAction = (path: string, data?: unknown) => apiClient.post(path, data)

export const shareQuestion = (id: string) => postAction(`/teacher/questions/${id}/share`)
export const archiveQuestion = (id: string) => postAction(`/teacher/questions/${id}/archive`)
export const restoreQuestion = (id: string) => postAction(`/teacher/questions/${id}/restore`)
export const removeSharedQuestion = (itemId: string, reason: string) =>
  postAction(`/teacher/question-approvals/${itemId}/remove`, { reason })
