import { apiClient } from '../../../api/axios'

export interface ExamMatrixProposal {
  easyCount: number
  mediumCount: number
  hardCount: number
  rationale: string
}

interface ApiResponse<T> { data: T }

export interface ExamMatrixSuggestion {
  proposal: ExamMatrixProposal | null
  shortage: number
  inventory: { availableEasy: number; availableMedium: number; availableHard: number }
}

export async function suggestExamMatrix(input: {
  subjectId: string
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  desiredCount: number
  message: string
}): Promise<ExamMatrixSuggestion> {
  const { data } = await apiClient.post<ApiResponse<ExamMatrixSuggestion>>('/teacher/exams/agent-matrix', input)
  return data.data
}
