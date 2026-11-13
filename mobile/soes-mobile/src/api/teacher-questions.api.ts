import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { LearningTopic, ObjectiveQuestionPayload, QuestionPage, QuestionSubject, QuestionType, TeacherQuestion } from '../types/teacher-questions.types'

export interface QuestionFilters { scope: 'PERSONAL' | 'SHARED'; archived: boolean; keyword: string; type?: QuestionType }
export async function listQuestions(page: number, filters: QuestionFilters) {
  const { data } = await apiClient.get<ApiResponse<QuestionPage>>('/teacher/questions', { params: {
    page, pageSize: 20, scope: filters.scope, archived: String(filters.archived),
    keyword: filters.keyword || undefined, type: filters.type,
  } })
  return data.data
}
export const listQuestionSubjects = async () => (await apiClient.get<ApiResponse<QuestionSubject[]>>('/teacher/question-subjects')).data.data
export const listLearningTopics = async (subjectId: string) =>
  (await apiClient.get<ApiResponse<LearningTopic[]>>(`/teacher/subjects/${subjectId}/learning-topics`)).data.data
export const createLearningTopic = async (subjectId: string, input: { code: string; name: string }) =>
  (await apiClient.post<ApiResponse<LearningTopic>>(`/teacher/subjects/${subjectId}/learning-topics`, input)).data.data
export const assignQuestionTopics = (questionId: string, topicIds: string[]) =>
  apiClient.put(`/teacher/questions/${questionId}/learning-topics`, { topicIds })
export interface TopicSuggestion {
  existing: LearningTopic[]; proposed: { code: string; name: string } | null; rationale: string
}
export const suggestQuestionTopic = async (input: { subjectId: string; title: string; content: string }) =>
  (await apiClient.post<ApiResponse<TopicSuggestion>>('/teacher/questions/topic-suggestion', input)).data.data
export const createQuestion = async (payload: ObjectiveQuestionPayload) =>
  (await apiClient.post<ApiResponse<TeacherQuestion>>('/teacher/questions', payload)).data.data
export const updateQuestion = async (id: string, payload: ObjectiveQuestionPayload) =>
  (await apiClient.put<ApiResponse<TeacherQuestion>>(`/teacher/questions/${id}`, payload)).data.data
export const shareQuestion = (id: string) => apiClient.post(`/teacher/questions/${id}/share`)
export const archiveQuestion = (id: string) => apiClient.post(`/teacher/questions/${id}/archive`)
export const restoreQuestion = (id: string) => apiClient.post(`/teacher/questions/${id}/restore`)
