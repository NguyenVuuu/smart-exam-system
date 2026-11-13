import { apiClient } from '../../../api/axios'

interface ApiResponse<T> { data: T }

export interface AgentExamDraft {
  questionIds: string[]
  rationale: string
  difficultyMatrix: { easy: number; medium: number; hard: number }
  topicMatrix: Array<{ id: string; code: string; name: string; count: number }>
  unlabeledCount: number
  questions: Array<{ id: string; title: string; difficulty: 'EASY' | 'MEDIUM' | 'HARD'; type: string; topics: string[] }>
}

export async function proposeAgentExamDraft(input: {
  subjectId: string
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  desiredCount: number
  message: string
  topicTargets: Array<{ topicId: string; count: number }>
}): Promise<AgentExamDraft> {
  const { data } = await apiClient.post<ApiResponse<AgentExamDraft>>('/teacher/exams/agent-draft', input, { timeout: 70000 })
  return data.data
}

export interface TopicSuggestion {
  existing: Array<{ id: string; code: string; name: string }>
  proposed: { code: string; name: string } | null
  rationale: string
}

export async function suggestQuestionTopic(input: {
  subjectId: string; title: string; content: string
}): Promise<TopicSuggestion> {
  const { data } = await apiClient.post<ApiResponse<TopicSuggestion>>('/teacher/questions/topic-suggestion', input)
  return data.data
}
