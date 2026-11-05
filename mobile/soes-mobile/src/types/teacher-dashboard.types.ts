export interface CourseSummary {
  id: string; code: string; status: 'ACTIVE' | 'CLOSED'
  subject: { name: string; code: string }
  semester: { name: string }
  enrollmentCount: number
}
export interface AssignmentSummary {
  id: string; title: string; startTime: string; endTime: string; status: string
  courseOffering: { code: string; subjectName: string }
}
export interface ApprovalSummary { id: string; title: string; reviewRound: { submittedAt: string } }
export interface Page<T> { items: T[]; pagination: { totalItems: number } }

export type DashboardResult<T> = { data: T; failed: false } | { data: T; failed: true }

export interface DashboardData {
  courses: DashboardResult<Page<CourseSummary>>
  assignments: DashboardResult<Page<AssignmentSummary>>
  approvals: DashboardResult<Page<ApprovalSummary>>
  unread: DashboardResult<number>
}
