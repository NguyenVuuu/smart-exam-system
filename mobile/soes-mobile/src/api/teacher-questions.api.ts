import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ObjectiveQuestionPayload, QuestionPage, QuestionSubject, QuestionType, TeacherQuestion } from '../types/teacher-questions.types'

export interface QuestionFilters { scope: 'PERSONAL' | 'SHARED'; archived: boolean; keyword: string; type?: QuestionType }
export async function listQuestions(page: number, filters: QuestionFilters) {
  const { data } = await apiClient.get<ApiResponse<QuestionPage>>('/teacher/questions', { params: {
    page, pageSize: 20, scope: filters.scope, archived: String(filters.archived),
    keyword: filters.keyword || undefined, type: filters.type,
  } })
  return data.data
}
export const listQuestionSubjects = async () => (await apiClient.get<ApiResponse<QuestionSubject[]>>('/teacher/question-subjects')).data.data
export const createQuestion = async (payload: ObjectiveQuestionPayload) =>
  (await apiClient.post<ApiResponse<TeacherQuestion>>('/teacher/questions', payload)).data.data
export const updateQuestion = async (id: string, payload: ObjectiveQuestionPayload) =>
  (await apiClient.put<ApiResponse<TeacherQuestion>>(`/teacher/questions/${id}`, payload)).data.data
