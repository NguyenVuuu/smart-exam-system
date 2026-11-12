import { apiClient } from './client'

export interface StudentLearningInsights {
  analyzedAttemptCount: number
  limitedToRecentAttempts: boolean
  topics: Array<{
    topicId: string
    name: string
    questionCount: number
    percentage: number
    sufficientData: boolean
  }>
}

export interface LearningAnswer {
  summary: string
  actions: string[]
  caveat: string | null
}

interface ApiResponse<T> { data: T }

export async function getLearningInsights(): Promise<StudentLearningInsights> {
  const { data } = await apiClient.get<ApiResponse<StudentLearningInsights>>('/student/learning/insights')
  return data.data
}

export async function askLearningAgent(message: string): Promise<LearningAnswer> {
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer }>>(
    '/student/learning/ask', { message }, { timeout: 30000 },
  )
  return data.data.answer
}
