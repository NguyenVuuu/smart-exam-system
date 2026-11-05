import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { QuestionPage, QuestionType } from '../types/teacher-questions.types'

export interface QuestionFilters { scope: 'PERSONAL' | 'SHARED'; archived: boolean; keyword: string; type?: QuestionType }
export async function listQuestions(page: number, filters: QuestionFilters) {
  const { data } = await apiClient.get<ApiResponse<QuestionPage>>('/teacher/questions', { params: {
    page, pageSize: 20, scope: filters.scope, archived: String(filters.archived),
    keyword: filters.keyword || undefined, type: filters.type,
  } })
  return data.data
}
