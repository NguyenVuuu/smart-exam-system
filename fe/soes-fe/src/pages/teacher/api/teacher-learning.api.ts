import { apiClient } from '../../../api/axios'

export interface TeacherLearningInsights {
  analyzedAttemptCount: number
  limitedToRecentAttempts: boolean
  topics: Array<{
    topicId: string
    name: string
    questionCount: number
    percentage: number
    sufficientData: boolean
  }>
  questions: Array<{
    questionId: string
    exposureCount: number
    averagePercentage: number
    signal: 'INSUFFICIENT_DATA' | 'VERY_HARD' | 'VERY_EASY' | 'NORMAL'
  }>
}

export interface TeacherLearningAnswer {
  summary: string
  actions: string[]
  caveat: string | null
}

export interface ProgrammingReview {
  summary: string
  suggestions: string[]
  caveat: string
}

interface ApiResponse<T> { data: T }

export async function getTeacherLearningInsights(scheduleId: string): Promise<TeacherLearningInsights> {
  const { data } = await apiClient.get<ApiResponse<TeacherLearningInsights>>(`/teacher/learning/schedules/${scheduleId}/insights`)
  return data.data
}

export async function askTeacherLearningAgent(scheduleId: string, message: string): Promise<TeacherLearningAnswer> {
  const { data } = await apiClient.post<ApiResponse<{ answer: TeacherLearningAnswer }>>(
    `/teacher/learning/schedules/${scheduleId}/ask`, { message },
  )
  return data.data.answer
}

export async function reviewProgrammingSubmission(attemptId: string, examQuestionId: string): Promise<ProgrammingReview> {
  const { data } = await apiClient.post<ApiResponse<ProgrammingReview>>(
    '/teacher/learning/programming-review', { attemptId, examQuestionId }, { timeout: 65000 },
  )
  return data.data
}
