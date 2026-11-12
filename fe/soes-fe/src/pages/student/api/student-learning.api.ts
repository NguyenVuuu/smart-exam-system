import { apiClient } from '../../../api/axios'

export interface TopicInsight {
  topicId: string
  code: string
  name: string
  questionCount: number
  percentage: number
  sufficientData: boolean
}

export interface StudentLearningInsights {
  analyzedAttemptCount: number
  limitedToRecentAttempts: boolean
  topics: TopicInsight[]
}

export interface LearningAnswer {
  summary: string
  actions: string[]
  evidenceIds: string[]
  caveat: string | null
}

interface ApiResponse<T> { data: T }

export async function getLearningInsights(): Promise<StudentLearningInsights> {
  const { data } = await apiClient.get<ApiResponse<StudentLearningInsights>>('/student/learning/insights')
  return data.data
}

export async function askLearningAgent(message: string): Promise<LearningAnswer> {
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer }>>('/student/learning/ask', { message })
  return data.data.answer
}
