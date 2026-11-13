import { apiClient } from '../../../api/axios'
import type { AgentConversationSummary, AgentConversationTurn } from '../../../components/common/AgentConversationHistory'

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
    title: string
    exposureCount: number
    respondentCount: number
    averagePercentage: number
    signal: 'INSUFFICIENT_DATA' | 'VERY_HARD' | 'VERY_EASY' | 'NORMAL'
  }>
  classes: Array<{
    courseOfferingId: string
    code: string
    studentCount: number
    sufficientData: boolean
    topics: TeacherLearningInsights['topics']
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

export async function askTeacherLearningAgent(scheduleId: string, message: string, conversationId?: string) {
  const { data } = await apiClient.post<ApiResponse<{ answer: TeacherLearningAnswer; conversationId: string }>>(
    `/teacher/learning/schedules/${scheduleId}/ask`, { message, conversationId },
  )
  return data.data
}

export async function listTeacherLearningConversations(scheduleId: string): Promise<AgentConversationSummary[]> {
  const { data } = await apiClient.get<ApiResponse<AgentConversationSummary[]>>(
    `/teacher/learning/schedules/${scheduleId}/conversations`)
  return data.data
}

export async function getTeacherLearningConversation(scheduleId: string, id: string): Promise<{ id: string; turns: AgentConversationTurn<TeacherLearningAnswer>[] }> {
  const { data } = await apiClient.get<ApiResponse<{ id: string; turns: AgentConversationTurn<TeacherLearningAnswer>[] }>>(
    `/teacher/learning/schedules/${scheduleId}/conversations/${id}`)
  return data.data
}

export async function reviewProgrammingSubmission(attemptId: string, examQuestionId: string): Promise<ProgrammingReview> {
  const { data } = await apiClient.post<ApiResponse<ProgrammingReview>>(
    '/teacher/learning/programming-review', { attemptId, examQuestionId }, { timeout: 65000 },
  )
  return data.data
}
