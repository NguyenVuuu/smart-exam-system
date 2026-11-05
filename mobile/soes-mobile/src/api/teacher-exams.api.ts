import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ExamDetail, ExamPage, ExamSchedule, ReviewHistory } from '../types/teacher-exams.types'

export async function listExams(page: number, keyword: string, type?: 'QUIZ' | 'MIDTERM' | 'FINAL') {
  const { data } = await apiClient.get<ApiResponse<ExamPage>>('/teacher/exams', { params: { page, pageSize: 20, keyword: keyword || undefined, type } })
  return data.data
}
export async function getExam(id: string) {
  const { data } = await apiClient.get<ApiResponse<ExamDetail>>(`/teacher/exams/${id}`)
  return data.data
}
export async function getExamSchedules(id: string) {
  const { data } = await apiClient.get<ApiResponse<ExamSchedule[]>>(`/teacher/exams/${id}/schedules`)
  return data.data
}
export async function getReviewHistory(id: string) {
  const { data } = await apiClient.get<ApiResponse<ReviewHistory[]>>(`/teacher/exams/${id}/review-history`)
  return data.data
}
