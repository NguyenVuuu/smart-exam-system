import { apiClient } from '../../../api/axios'
import type { AgentConversationSummary, AgentConversationTurn } from '../../../components/common/AgentConversationHistory'

export interface TopicInsight {
  topicId: string
  subjectId: string
  code: string
  name: string
  questionCount: number
  percentage: number
  sufficientData: boolean
  needsPractice: boolean
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
  courseOffering: { id: string; code: string; subject: { id: string; name: string } }
}

interface PracticeBaseItem {
  id: string
  orderIndex: number
  stem: string
}

export interface ChoicePracticeItem extends PracticeBaseItem {
  kind: 'CHOICE'
  options: string[]
  result?: { selectedIndex: number; correctIndex: number; explanation: string; supportQuote: string; materialTitle?: string }
}

export interface ProgrammingPracticeItem extends PracticeBaseItem {
  kind: 'PROGRAMMING'
  language: 'C' | 'CPP' | 'JAVA'
  starterCode: string
  sampleInput: string
  sampleOutput: string
  result?: { sourceCode: string; passedTestCases: number; totalTestCases: number;
    explanation: string; supportQuote: string; materialTitle?: string }
}

export type PracticeItem = ChoicePracticeItem | ProgrammingPracticeItem

export interface PracticeSet {
  id: string
  completedAt?: string | null
  score?: number | null
  items: PracticeItem[]
}

export interface PracticeSummary {
  id: string
  createdAt: string
  completedAt: string | null
  score: number | null
  subject: { name: string }
  _count: { items: number }
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

export async function askLearningAgent(message: string, materialId?: string, conversationId?: string) {
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer; conversationId: string }>>(
    '/student/learning/ask', { message, materialId, conversationId })
  return data.data
}

export async function listLearningConversations(materialId?: string): Promise<AgentConversationSummary[]> {
  const { data } = await apiClient.get<ApiResponse<AgentConversationSummary[]>>('/student/learning/conversations',
    { params: { materialId } })
  return data.data
}

export async function getLearningConversation(id: string, materialId?: string): Promise<{ id: string; turns: AgentConversationTurn<LearningAnswer>[] }> {
  const { data } = await apiClient.get<ApiResponse<{ id: string; turns: AgentConversationTurn<LearningAnswer>[] }>>(
    `/student/learning/conversations/${id}`, { params: { materialId } })
  return data.data
}

export async function explainReviewQuestion(
  scheduleId: string, attemptId: string, questionId: string, message: string,
): Promise<LearningAnswer> {
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer }>>(
    `/student/learning/attempts/${attemptId}/questions/${questionId}/explain`,
    { scheduleId, message }, { timeout: 65000 },
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

export async function createPracticeSet(materialId: string, count = 5, focusTopicId?: string,
  instruction?: string): Promise<PracticeSet> {
  const { data } = await apiClient.post<ApiResponse<PracticeSet>>('/student/learning/practice',
    { materialId, count, focusTopicId, instruction }, { timeout: 240000 })
  return data.data
}

export async function submitPracticeSet(id: string, answers: ({ itemId: string; selectedIndex: number } | { itemId: string; sourceCode: string })[]): Promise<PracticeSet> {
  const { data } = await apiClient.post<ApiResponse<PracticeSet>>(`/student/learning/practice/${id}/submit`, { answers }, { timeout: 240000 })
  return data.data
}
