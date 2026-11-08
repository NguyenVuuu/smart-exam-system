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

export type FaceEnrollmentResult = { status: 'PROCESSING' | 'PASSED' | 'FAILED' }

export async function getStudentFaceProfile(): Promise<StudentFaceProfile> {
  const response = await apiClient.get<{ data: StudentFaceProfile }>('/student/face/profile')
  return response.data.data
}

export async function createFaceEnrollmentSession(): Promise<FaceEnrollmentSession> {
  const response = await apiClient.post<{ data: FaceEnrollmentSession }>('/student/face/sessions', { purpose: 'ENROLLMENT' })
  return response.data.data
}

export async function completeFaceEnrollmentSession(id: string): Promise<FaceEnrollmentResult> {
  const response = await apiClient.post<{ data: FaceEnrollmentResult }>(`/student/face/sessions/${id}/complete`)
  return response.data.data
}
