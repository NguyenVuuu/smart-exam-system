import { apiClient } from '../../../api/axios'

export interface ExamMatrixProposal {
  easyCount: number
  mediumCount: number
  hardCount: number
  rationale: string
}

interface ApiResponse<T> { data: T }

export async function suggestExamMatrix(input: {
  subjectId: string
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  desiredCount: number
  message: string
}): Promise<ExamMatrixProposal> {
  const { data } = await apiClient.post<ApiResponse<{ proposal: ExamMatrixProposal }>>('/teacher/exams/agent-matrix', input)
  return data.data.proposal
}
