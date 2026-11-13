import { apiClient } from './client'
import { isAxiosError } from 'axios'

export function getLearningAgentError(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  if (error.response?.status === 503) return 'Dịch vụ AI đang quá tải hoặc tạm gián đoạn. Vui lòng thử lại sau.'
  if (error.response?.status === 429) return 'Dịch vụ AI đã đạt giới hạn lượt dùng. Vui lòng thử lại sau.'
  if (error.response?.status === 422) {
    const message = (error.response.data as { message?: unknown } | undefined)?.message
    if (message === 'AI study material has no readable text') return 'Tài liệu này không có văn bản để AI đọc. Hãy chọn tài liệu khác.'
    if (message === 'AI generated questions about document structure instead of subject knowledge')
      return 'AI chưa tạo được câu hỏi kiến thức phù hợp. Hãy nêu khái niệm cụ thể trong chương hoặc chọn tài liệu khác.'
    if (message === 'AI generated fewer questions than requested' || message === 'AI could not create enough verified practice questions' ||
      message === 'AI could not verify the answers against the selected material')
      return 'Chưa đủ câu hỏi có đáp án kiểm chứng từ tài liệu. Hãy giảm số câu hoặc mô tả kiến thức cụ thể hơn.'
    if (message === 'AI chưa tạo được bài lập trình có test case hợp lệ từ tài liệu này')
      return 'Chưa tạo được bài lập trình có test case hợp lệ. Hãy mô tả bài toán và chọn tài liệu phù hợp hơn.'
  }
  return fallback
}

export interface StudentLearningInsights {
  analyzedAttemptCount: number
  limitedToRecentAttempts: boolean
  topics: {
    topicId: string
    subjectId: string
    name: string
    questionCount: number
    percentage: number
    sufficientData: boolean
    needsPractice: boolean
  }[]
}

export interface LearningAnswer {
  summary: string
  actions: string[]
  evidenceIds: string[]
  caveat: string | null
}

export interface LearningConversationSummary {
  id: string
  updatedAt: string
  turns: { message: string }[]
}

export interface LearningConversationTurn {
  id: string
  message: string
  answer: LearningAnswer
  createdAt: string
}

export interface StudyMaterial {
  id: string
  title: string | null
  fileName: string
  courseOffering: { subject: { id: string; name: string } }
}

type PracticeItem = ({
  id: string; orderIndex: number; stem: string; kind: 'CHOICE'; options: string[]
  result?: { selectedIndex: number; correctIndex: number; explanation: string; supportQuote: string; materialTitle?: string }
} | {
  id: string; orderIndex: number; stem: string; kind: 'PROGRAMMING'; language: 'C' | 'CPP' | 'JAVA'
  starterCode: string; sampleInput: string; sampleOutput: string
  result?: { sourceCode: string; passedTestCases: number; totalTestCases: number;
    explanation: string; supportQuote: string; materialTitle?: string }
})

export interface PracticeSet {
  id: string
  completedAt?: string | null
  score?: number | null
  items: PracticeItem[]
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

export async function askLearningAgent(message: string, materialId: string, conversationId?: string) {
  const { data } = await apiClient.post<ApiResponse<{ answer: LearningAnswer; conversationId: string }>>(
    '/student/learning/ask', { message, materialId, conversationId }, { timeout: 65000 },
  )
  return data.data
}

export async function listLearningConversations(materialId: string): Promise<LearningConversationSummary[]> {
  const { data } = await apiClient.get<ApiResponse<LearningConversationSummary[]>>(
    '/student/learning/conversations', { params: { materialId } })
  return data.data
}

export async function getLearningConversation(id: string, materialId: string): Promise<LearningConversationTurn[]> {
  const { data } = await apiClient.get<ApiResponse<{ turns: LearningConversationTurn[] }>>(
    `/student/learning/conversations/${id}`, { params: { materialId } })
  return data.data.turns
}

export async function listPracticeSets(): Promise<PracticeSummary[]> {
  const { data } = await apiClient.get<ApiResponse<PracticeSummary[]>>('/student/learning/practice')
  return data.data
}

export async function getPracticeSet(id: string): Promise<PracticeSet> {
  const { data } = await apiClient.get<ApiResponse<PracticeSet>>(`/student/learning/practice/${id}`)
  return data.data
}

export async function createPracticeSet(materialId: string, count: number, focusTopicId?: string,
  instruction?: string): Promise<PracticeSet> {
  const { data } = await apiClient.post<ApiResponse<PracticeSet>>('/student/learning/practice',
    { materialId, count, focusTopicId, instruction }, { timeout: 240000 })
  return data.data
}

export async function submitPracticeSet(id: string, answers: ({ itemId: string; selectedIndex: number } | { itemId: string; sourceCode: string })[]): Promise<PracticeSet> {
  const { data } = await apiClient.post<ApiResponse<PracticeSet>>(`/student/learning/practice/${id}/submit`, { answers }, { timeout: 240000 })
  return data.data
}
