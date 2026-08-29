import { apiClient } from '../../../api/axios'
import type {
  TeacherExamDetailDto, TeacherExamDto, TeacherExamPayload,
  TeacherExamScheduleDto, TeacherExamSchedulePayload,
} from '../types/teacher-exam-api.types'

interface ApiResponse<T> { success: boolean; data: T }

export async function getTeacherExams() {
  const response = await apiClient.get<ApiResponse<{ items: TeacherExamDto[] }>>('/teacher/exams', {
    params: { page: 1, pageSize: 100 },
  })
  return response.data.data.items
}

export async function getTeacherExam(id: string) {
  const response = await apiClient.get<ApiResponse<TeacherExamDetailDto>>(`/teacher/exams/${id}`)
  return response.data.data
}

export async function copyTeacherExam(id: string) {
  const response = await apiClient.post<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}/copy`)
  return response.data.data
}

export const deleteTeacherExam = (id: string) => apiClient.delete(`/teacher/exams/${id}`)

export async function createTeacherExam(payload: TeacherExamPayload) {
  const response = await apiClient.post<ApiResponse<TeacherExamDto>>('/teacher/exams', payload)
  return response.data.data
}

export async function updateTeacherExam(id: string, payload: TeacherExamPayload) {
  const response = await apiClient.put<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}`, payload)
  return response.data.data
}

export const replaceTeacherExamQuestions = (
  id: string,
  items: Array<{ questionId: string; points: number; sectionId?: string }>,
) => apiClient.put(`/teacher/exams/${id}/questions`, { items })

export const submitTeacherExam = (id: string) => apiClient.post(`/teacher/exams/${id}/submit`)

export const getTeacherExamSchedules = (examId: string) =>
  apiClient.get<ApiResponse<TeacherExamScheduleDto[]>>(`/teacher/exams/${examId}/schedules`).then(({ data }) => data.data)

export const createTeacherExamSchedule = (examId: string, payload: TeacherExamSchedulePayload) =>
  apiClient.post<ApiResponse<TeacherExamScheduleDto>>(`/teacher/exams/${examId}/schedules`, payload).then(({ data }) => data.data)

export const updateTeacherExamSchedule = (examId: string, scheduleId: string, payload: TeacherExamSchedulePayload) =>
  apiClient.put<ApiResponse<TeacherExamScheduleDto>>(`/teacher/exams/${examId}/schedules/${scheduleId}`, payload).then(({ data }) => data.data)

export const cancelTeacherExamSchedule = (examId: string, scheduleId: string, reason: string) =>
  apiClient.post<ApiResponse<TeacherExamScheduleDto>>(`/teacher/exams/${examId}/schedules/${scheduleId}/cancel`, { reason }).then(({ data }) => data.data)
