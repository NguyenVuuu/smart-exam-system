import { apiClient } from './client'

export interface StudentLearningInsights {
  analyzedAttemptCount: number
  limitedToRecentAttempts: boolean
  topics: {
    topicId: string
    name: string
    questionCount: number
    percentage: number
    sufficientData: boolean
  }[]
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
  courseOffering: { subject: { name: string } }
}

export interface PracticeSet {
  id: string
  completedAt?: string | null
  score?: number | null
  items: {
    id: string; orderIndex: number; stem: string; options: string[]
    result?: { selectedIndex: number; correctIndex: number; explanation: string; supportQuote: string; materialTitle?: string }
  }[]
}

export interface PracticeSummary {
  id: string; createdAt: string; completedAt: string | null; score: number | null
  subject: { name: string }; _count: { items: number }
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
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer }>>(
    '/student/learning/ask', { message, materialId }, { timeout: 65000 },
  )
  return data.data.answer
}

export async function listPracticeSets(): Promise<PracticeSummary[]> {
  const { data } = await apiClient.get<ApiResponse<PracticeSummary[]>>('/student/learning/practice')
  return data.data
}

export async function getPracticeSet(id: string): Promise<PracticeSet> {
  const { data } = await apiClient.get<ApiResponse<PracticeSet>>(`/student/learning/practice/${id}`)
  return data.data
}

export async function createPracticeSet(materialId: string): Promise<PracticeSet> {
  const { data } = await apiClient.post<ApiResponse<PracticeSet>>('/student/learning/practice',
    { materialId, count: 5 }, { timeout: 65000 })
  return data.data
}

export async function submitPracticeSet(id: string, answers: { itemId: string; selectedIndex: number }[]): Promise<PracticeSet> {
  const { data } = await apiClient.post<ApiResponse<PracticeSet>>(`/student/learning/practice/${id}/submit`, { answers })
  return data.data
}
