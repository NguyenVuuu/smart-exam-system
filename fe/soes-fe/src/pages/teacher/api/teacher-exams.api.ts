import { apiClient } from '../../../api/axios'
import type {
  TeacherExamDetailDto, TeacherExamDto, TeacherExamPayload,
  TeacherExamScheduleDto, TeacherExamSchedulePayload,
  TeacherSubmissionPage,
} from '../types/teacher-exam-api.types'
import type { CameraReportRecord, ProctoringSessionRecord, ViolationRecord } from '../types/teacher-exam.types'
import type { Question } from '../types/teacher-question-bank.types'

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

export interface AutoGenerateTeacherExamPayload {
  title: string
  description?: string | null
  subjectId: string
  semesterId: string
  type: TeacherExamPayload['type']
  format: TeacherExamPayload['format']
  defaultDurationMinutes: number
  totalPoints: number
  pickMode: 'AUTO' | 'MANUAL'
  sourceScope: 'PERSONAL' | 'SHARED' | 'BOTH'
  matrix: { easy: number; medium: number; hard: number }
  selectedQuestionIds: string[]
}

export async function autoGenerateTeacherExam(payload: AutoGenerateTeacherExamPayload) {
  const response = await apiClient.post<ApiResponse<TeacherExamDetailDto>>('/teacher/exams/auto-generate', payload)
  return response.data.data
}

export async function updateTeacherExam(id: string, payload: TeacherExamPayload) {
  const response = await apiClient.put<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}`, payload)
  return response.data.data
}

type ExamQuestionPlacement = { points: number; sectionId?: string }
export type TeacherExamQuestionInput = ExamQuestionPlacement & (
  | { source: 'QUESTION_BANK'; questionId: string }
  | { source: 'INLINE'; question: {
      title: string; content: string; explanation?: string | null
      type: Question['type']; difficulty: Question['difficulty']
      language?: Question['programmingLanguage'] | null
      options: Array<{ content: string; isCorrect: boolean }>
      programmingConfig?: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
      testCases: Array<{ input: string; expectedOutput: string; isHidden: boolean }>
    } }
)
export const replaceTeacherExamQuestions = (id: string, items: TeacherExamQuestionInput[]) =>
  apiClient.put(`/teacher/exams/${id}/questions`, { items })

export const submitTeacherExam = (id: string) => apiClient.post(`/teacher/exams/${id}/submit`)

export const lockTeacherExamDistribution = (id: string) =>
  apiClient.post<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}/distribution-lock`).then(({ data }) => data.data)

export const unlockTeacherExamDistribution = (id: string) =>
  apiClient.delete<ApiResponse<TeacherExamDto>>(`/teacher/exams/${id}/distribution-lock`).then(({ data }) => data.data)

export const updateTeacherExamStudentVisibility = (
  id: string,
  visibility: TeacherExamDto['studentVisibility'],
) => apiClient.patch<ApiResponse<TeacherExamDto>>(
  `/teacher/exams/${id}/student-visibility`,
  { visibility },
).then(({ data }) => data.data)

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

export const getTeacherProctoringSessions = (examId: string, scheduleId: string) =>
  apiClient.get<ApiResponse<{ items: ProctoringSessionRecord[] }>>(`/teacher/exams/${examId}/schedules/${scheduleId}/proctoring-sessions`)
    .then(({ data }) => data.data.items)

export const getTeacherLiveProctoringSessions = (scheduleId: string) =>
  apiClient.get<ApiResponse<{ schedule: { id: string; examId: string; title: string; startTime: string; endTime: string }; items: ProctoringSessionRecord[] }>>(
    `/teacher/proctoring/schedules/${scheduleId}/sessions`,
  ).then(({ data }) => data.data)

export const getTeacherLiveProctoringViolations = (scheduleId: string) =>
  apiClient.get<ApiResponse<{ items: ViolationRecord[] }>>(
    `/teacher/proctoring/schedules/${scheduleId}/violations`,
    { params: { page: 1, pageSize: 100 } },
  ).then(({ data }) => data.data.items)

export interface TeacherLiveCameraSession {
  id: string
  attemptId: string
  scheduleId: string
  status: 'REQUESTED' | 'OFFERED' | 'CONNECTED' | 'ENDED'
  offer: RTCSessionDescriptionInit | null
  answer: RTCSessionDescriptionInit | null
  studentCandidateCount: number
  teacherCandidateCount: number
  updatedAt: string
}

export const startTeacherLiveCamera = (attemptId: string) =>
  apiClient.post<ApiResponse<TeacherLiveCameraSession>>(`/teacher/proctoring/attempts/${attemptId}/live/start`)
    .then(({ data }) => data.data)

export const getTeacherLiveCameraSession = (sessionId: string) =>
  apiClient.get<ApiResponse<TeacherLiveCameraSession>>(`/teacher/proctoring/live/${sessionId}`)
    .then(({ data }) => data.data)

export const submitTeacherLiveCameraAnswer = (sessionId: string, signal: RTCSessionDescriptionInit) =>
  apiClient.post<ApiResponse<TeacherLiveCameraSession>>(`/teacher/proctoring/live/${sessionId}/answer`, { signal })
    .then(({ data }) => data.data)

export const addTeacherLiveCameraCandidate = (sessionId: string, candidate: RTCIceCandidateInit) =>
  apiClient.post<ApiResponse<{ ok: true }>>(`/teacher/proctoring/live/${sessionId}/ice-candidates`, { candidate })
    .then(({ data }) => data.data)

export const getTeacherLiveCameraCandidates = (sessionId: string, from: number) =>
  apiClient.get<ApiResponse<{ candidates: RTCIceCandidateInit[]; nextCursor: number }>>(
    `/teacher/proctoring/live/${sessionId}/ice-candidates`,
    { params: { from } },
  ).then(({ data }) => data.data)

export const endTeacherLiveCamera = (sessionId: string) =>
  apiClient.delete<ApiResponse<TeacherLiveCameraSession>>(`/teacher/proctoring/live/${sessionId}`)
    .then(({ data }) => data.data)

export const getTeacherCameraReport = (examId: string, scheduleId: string) =>
  apiClient.get<ApiResponse<{ items: CameraReportRecord[] }>>(`/teacher/exams/${examId}/schedules/${scheduleId}/camera-report`)
    .then(({ data }) => data.data.items)

export const reviewTeacherViolation = (
  examId: string,
  scheduleId: string,
  violationId: string,
  payload: { reviewStatus: 'PENDING' | 'CONFIRMED' | 'DISMISSED'; reviewNote?: string | null },
) => apiClient.patch(`/teacher/exams/${examId}/schedules/${scheduleId}/violations/${violationId}/review`, payload)

export const invalidateTeacherAttempt = (
  examId: string,
  scheduleId: string,
  attemptId: string,
  reason: string,
) => apiClient.post(`/teacher/exams/${examId}/schedules/${scheduleId}/submissions/${attemptId}/invalidate`, { reason })

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
