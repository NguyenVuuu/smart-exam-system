import { apiClient } from './client'
import type { ApiResponse } from '../types/auth.types'
import type { ApprovalSummary, AssignmentSummary, CourseSummary, DashboardData, DashboardResult, Page } from '../types/teacher-dashboard.types'
import { getUnreadNotificationCount } from './notifications.api'

async function getPage<T>(path: string, params: Record<string, string | number> = {}) {
  const { data } = await apiClient.get<ApiResponse<Page<T>>>(path, { params: { page: 1, pageSize: 3, ...params } })
  return data.data
}

function result<T>(settled: PromiseSettledResult<T>, fallback: T): DashboardResult<T> {
  return settled.status === 'fulfilled' ? { data: settled.value, failed: false } : { data: fallback, failed: true }
}

export async function getTeacherDashboard(): Promise<DashboardData> {
  const [courses, assignments, approvals, unread] = await Promise.allSettled([
    getPage<CourseSummary>('/teacher/course-offerings'),
    getPage<AssignmentSummary>('/teacher/proctor-assignments'),
    getPage<ApprovalSummary>('/teacher/exam-approvals', { status: 'PENDING' }),
    getUnreadNotificationCount(),
  ])
  const empty = { items: [], pagination: { totalItems: 0 } }
  return { courses: result(courses, empty), assignments: result(assignments, empty), approvals: result(approvals, empty), unread: result(unread, 0) }
}
