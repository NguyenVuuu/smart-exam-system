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

export interface StudyMaterial {
  id: string
  title: string | null
  fileName: string
  courseOffering: { id: string; code: string; subject: { name: string } }
}

interface ApiResponse<T> { data: T }

export async function getLearningInsights(): Promise<StudentLearningInsights> {
  const { data } = await apiClient.get<ApiResponse<StudentLearningInsights>>('/student/learning/insights')
  return data.data
}

export async function getStudyMaterials(): Promise<StudyMaterial[]> {
  const { data } = await apiClient.get<ApiResponse<StudyMaterial[]>>('/student/learning/materials')
  return data.data
}

export async function askLearningAgent(message: string, materialId?: string): Promise<LearningAnswer> {
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer }>>('/student/learning/ask', { message, materialId })
  return data.data.answer
}
