import { apiClient } from './client'

export interface StudentFaceProfile {
  enabled: boolean
  enrolled: boolean
}

export interface FaceEnrollmentSession {
  id: string
  providerSessionId: string
  expiresAt: string
  region: string
}

export type FaceEnrollmentResult =
  | { status: 'PROCESSING' | 'PASSED' }
  | { status: 'FAILED'; failureCode?: string; feedbackCodes?: string[] }

export async function getStudentFaceProfile(): Promise<StudentFaceProfile> {
  const response = await apiClient.get<{ data: StudentFaceProfile }>('/student/face/profile')
  return response.data.data
}

export async function createFaceEnrollmentSession(): Promise<FaceEnrollmentSession> {
  const response = await apiClient.post<{ data: FaceEnrollmentSession }>('/student/face/sessions', { purpose: 'ENROLLMENT', retainImageConsent: true })
  return response.data.data
}

export async function completeFaceEnrollmentSession(id: string): Promise<FaceEnrollmentResult> {
  const response = await apiClient.post<{ data: FaceEnrollmentResult }>(`/student/face/sessions/${id}/complete`)
  return response.data.data
}

export async function cancelFaceEnrollmentSession(id: string): Promise<void> {
  await apiClient.post(`/student/face/sessions/${id}/cancel`)
}
