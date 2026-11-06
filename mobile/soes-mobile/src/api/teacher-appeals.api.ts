import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { AppealPage, AppealStatus, TeacherAppeal, TeacherSubmission } from '../types/teacher-appeals.types'

export async function listTeacherAppeals(page: number, status: AppealStatus | 'ALL') {
  const { data } = await apiClient.get<ApiResponse<AppealPage>>('/teacher/grade-appeals', { params: { page, pageSize: 20, status } })
  return data.data
}

export async function getTeacherAppeal(id: string) {
  const { data } = await apiClient.get<ApiResponse<TeacherAppeal>>(`/teacher/grade-appeals/${id}`)
  return data.data
}

export async function updateTeacherAppeal(id: string, status: 'IN_REVIEW' | 'REJECTED', teacherReply?: string) {
  const { data } = await apiClient.patch<ApiResponse<TeacherAppeal>>(`/teacher/grade-appeals/${id}`, { status, teacherReply })
  return data.data
}

export async function findAppealSubmission(appeal: TeacherAppeal): Promise<TeacherSubmission> {
  const { examId, scheduleId } = appeal.exam
  let page = 1
  let totalPages = 1
  do {
    const { data } = await apiClient.get<ApiResponse<{ items: TeacherSubmission[]; pagination: { totalPages: number } }>>(
      `/teacher/exams/${examId}/schedules/${scheduleId}/submissions`, { params: { page, pageSize: 100 } },
    )
    const submission = data.data.items.find((item) => item.attemptId === appeal.attemptId)
    if (submission) return submission
    totalPages = data.data.pagination.totalPages
    page += 1
  } while (page <= totalPages)
  throw new Error('Không tìm thấy bài nộp cần phúc khảo')
}

export async function gradeAppeal(appeal: TeacherAppeal, score: number, reason: string) {
  const { examId, scheduleId } = appeal.exam
  await apiClient.patch(`/teacher/exams/${examId}/schedules/${scheduleId}/submissions/${appeal.attemptId}/grade`, {
    score, reason, adjustmentType: 'GRADE_APPEAL',
  })
}
