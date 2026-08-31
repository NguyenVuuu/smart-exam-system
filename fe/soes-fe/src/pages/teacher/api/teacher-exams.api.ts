import { apiClient } from '../../../api/axios'
import type {
  TeacherExamDetailDto, TeacherExamDto, TeacherExamPayload,
  TeacherExamScheduleDto, TeacherExamSchedulePayload,
  TeacherSubmissionPage,
} from '../types/teacher-exam-api.types'
import type { ViolationRecord } from '../types/teacher-exam.types'

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

export const lockTeacherExamDistribution = (id: string) =>
  apiClient.post<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}/distribution-lock`).then(({ data }) => data.data)

export const unlockTeacherExamDistribution = (id: string) =>
  apiClient.delete<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}/distribution-lock`).then(({ data }) => data.data)

export const getTeacherExamSchedules = (examId: string) =>
  apiClient.get<ApiResponse<TeacherExamScheduleDto[]>>(`/teacher/exams/${examId}/schedules`).then(({ data }) => data.data)

export const createTeacherExamSchedule = (examId: string, payload: TeacherExamSchedulePayload) =>
  apiClient.post<ApiResponse<TeacherExamScheduleDto>>(`/teacher/exams/${examId}/schedules`, payload).then(({ data }) => data.data)

export const updateTeacherExamSchedule = (examId: string, scheduleId: string, payload: TeacherExamSchedulePayload) =>
  apiClient.put<ApiResponse<TeacherExamScheduleDto>>(`/teacher/exams/${examId}/schedules/${scheduleId}`, payload).then(({ data }) => data.data)

export const cancelTeacherExamSchedule = (examId: string, scheduleId: string, reason: string) =>
  apiClient.post<ApiResponse<TeacherExamScheduleDto>>(`/teacher/exams/${examId}/schedules/${scheduleId}/cancel`, { reason }).then(({ data }) => data.data)

export const getTeacherExamSubmissions = (examId: string, scheduleId: string, page: number) =>
  apiClient.get<ApiResponse<TeacherSubmissionPage>>(`/teacher/exams/${examId}/schedules/${scheduleId}/submissions`, {
    params: { page, pageSize: 10 },
  }).then(({ data }) => data.data)

export const getTeacherExamViolations = (examId: string, scheduleId: string) =>
  apiClient.get<ApiResponse<{ items: ViolationRecord[] }>>(`/teacher/exams/${examId}/schedules/${scheduleId}/violations`, {
    params: { page: 1, pageSize: 100 },
  }).then(({ data }) => data.data.items)

export const gradeTeacherExamSubmission = (
  examId: string, scheduleId: string, attemptId: string, score: number, reason: string,
) => apiClient.patch(`/teacher/exams/${examId}/schedules/${scheduleId}/submissions/${attemptId}/grade`, {
  score, reason,
})

export const updateTeacherResultRelease = (
  examId: string,
  scheduleId: string,
  payload: { mode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED'; releaseAt?: string | null; published: boolean },
) => apiClient.patch(`/teacher/exams/${examId}/schedules/${scheduleId}/results`, payload)
