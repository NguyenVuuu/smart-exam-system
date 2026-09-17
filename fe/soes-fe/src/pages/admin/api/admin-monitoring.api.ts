import { apiClient } from '../../../api/axios'
import type { ApiResponse } from '../types/admin-api.types'

export interface AdminProctoringRowDto {
  id: string
  scheduleName: string
  examTitle: string
  subjectName: string
  courseCode: string
  startTime: string
  endTime: string
  participantCount: number
  joined: number
  online: number
  inProgress: number
  submitted: number
  absent: number
  disconnected: number
  warnings: number
  answered: number
  recentViolations: Array<{
    id: string
    studentCode: string
    studentName: string
    type: string
    severity: 'LOW' | 'MEDIUM' | 'HIGH'
    description?: string | null
    detectedAt: string
    evidenceCount: number
    evidenceUrls: string[]
  }>
  status: 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
}

export interface AdminReportRowDto {
  id: string
  scheduleTitle: string
  subject: string
  subjectCode: string
  departmentName: string
  semesterCode: string
  course: string
  participants: number
  joined: number
  submitted: number
  absent: number
  average: number
  highest: number
  lowest: number
  passedRate: number
  violations: number
  startTime: string
  status: 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
}

export interface AdminReportsDto {
  kpis: {
    schedules: number
    submissionRate: number
    averageScore: number
    violations: number
  }
  distribution: Array<{ range: string; count: number }>
  lowCorrectQuestions: Array<{
    id: string
    title: string
    scheduleTitle: string
    subject: string
    correct: number
    answered: number
    correctRate: number
  }>
  reviewAttempts: Array<{
    id: string
    scheduleTitle: string
    studentCode: string
    studentName: string
    courseCode: string
    score: number | null
    violationCount: number
    submittedAt: string | null
    reason: string
  }>
  rows: AdminReportRowDto[]
}

const unwrap = <T>({ data }: { data: ApiResponse<T> }) => data.data

export const getAdminProctoringOverview = () =>
  apiClient.get<ApiResponse<AdminProctoringRowDto[]>>('/admin/monitoring/proctoring').then(unwrap)

export const getAdminReportsOverview = () =>
  apiClient.get<ApiResponse<AdminReportsDto>>('/admin/monitoring/reports').then(unwrap)
