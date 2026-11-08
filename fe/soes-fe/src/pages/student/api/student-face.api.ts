import { apiClient } from '../../../api/axios'

interface ApiResponse<T> {
  data: T
}

export interface FaceProfile {
  enabled: boolean
  enrolled: boolean
  failedAttemptsSinceSuccess: number
  cooldownUntil: string | null
  requiresManualReview: boolean
  imageRetentionConsented: boolean
}

export interface FaceSession {
  id: string
  providerSessionId: string
  region: string
  expiresAt: string
}

export type FaceCompletion =
  | { status: 'PROCESSING' }
  | { status: 'FAILED'; requiresManualReview: boolean; cooldownUntil: string | null; failedAttemptsSinceSuccess: number; failureCode?: string; feedbackCodes?: string[] }
  | { status: 'PASSED'; id?: string; scheduleId?: string }

export const studentFaceApi = {
  profile: async () => (await apiClient.get<ApiResponse<FaceProfile>>('/student/face/profile')).data.data,
  start: async (purpose: 'ENROLLMENT' | 'EXAM_ENTRY', scheduleId?: string, retainImageConsent = false) =>
    (await apiClient.post<ApiResponse<FaceSession>>('/student/face/sessions', { purpose, scheduleId, retainImageConsent })).data.data,
  complete: async (id: string) =>
    (await apiClient.post<ApiResponse<FaceCompletion>>('/student/face/sessions/' + id + '/complete')).data.data,
  cancel: async (id: string) =>
    apiClient.post('/student/face/sessions/' + id + '/cancel'),
  manualApproval: async (scheduleId: string) =>
    (await apiClient.get<ApiResponse<{ id: string } | null>>('/student/face/schedules/' + scheduleId + '/manual-approval')).data.data,
}
