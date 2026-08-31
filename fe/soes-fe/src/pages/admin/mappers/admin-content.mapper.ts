import type { AdminExamTrackingApiDto, AdminQuestionBankApiDto } from '../types/admin-api.types'
import type { AdminExam, SharedQuestionAdmin } from '../types/admin.types'

const date = (value: string | null) => value ? new Intl.DateTimeFormat('vi-VN').format(new Date(value)) : undefined

export const toSharedQuestion = (row: AdminQuestionBankApiDto): SharedQuestionAdmin => ({
  id: row.id, title: row.title, content: row.content, explanation: row.explanation ?? undefined,
  subjectId: row.subject.id, subjectCode: row.subject.code, departmentId: row.subject.departmentId,
  type: row.type, difficulty: row.difficulty, contributorName: row.contributor.fullName,
  reviewedBy: row.reviewer?.fullName, reviewedAt: date(row.reviewedAt), status: row.status,
  removedBy: row.removedBy ?? undefined, removedAt: date(row.removedAt), removalReason: row.removalReason ?? undefined,
  options: row.options, programmingConfig: row.programmingConfig ?? undefined, testCases: row.testCases,
})

const examStatus = (row: AdminExamTrackingApiDto): AdminExam['status'] => {
  if (row.status === 'LOCKED') return 'LOCKED'
  if (row.status === 'ARCHIVED') return 'ARCHIVED'
  if (row.approvalStatus === 'PENDING') return 'PENDING_APPROVAL'
  if (row.approvalStatus === 'REJECTED') return 'REJECTED'
  if (row.status === 'READY' || row.approvalStatus === 'APPROVED') return 'APPROVED'
  return 'DRAFT'
}

export const toTrackedExam = (row: AdminExamTrackingApiDto): AdminExam => ({
  id: row.id, title: row.title, semesterCode: row.semester.code, departmentId: row.subject.departmentId,
  subjectCode: row.subject.code, subjectName: row.subject.name, authorName: row.creator.fullName,
  category: row.type, structure: row.format, totalPoints: row.totalPoints,
  questionCount: row.questionCount, durationMinutes: row.durationMinutes, status: examStatus(row),
})
