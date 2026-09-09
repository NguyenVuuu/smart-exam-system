import type { AuditActorRole } from '../types/admin-api.types'

const actionLabels: Record<string, string> = {
  LOGIN: 'Đăng nhập', LOGOUT: 'Đăng xuất', CREATE_EXAM: 'Tạo đề thi', UPDATE_EXAM: 'Cập nhật đề thi',
  DELETE_EXAM: 'Xóa đề thi', VIEW_EXAM: 'Xem đề thi', SUBMIT_EXAM: 'Nộp bài thi', CREATE_QUESTION: 'Tạo câu hỏi',
  UPDATE_QUESTION: 'Cập nhật câu hỏi', SUBMIT_SHARED_QUESTION: 'Gửi câu hỏi dùng chung',
  AUTO_APPROVE_SHARED_QUESTION: 'Tự động duyệt câu hỏi', APPROVE_SHARED_QUESTION: 'Duyệt câu hỏi',
  REJECT_SHARED_QUESTION: 'Từ chối câu hỏi', REMOVE_SHARED_QUESTION: 'Gỡ câu hỏi dùng chung',
  RESTORE_SHARED_QUESTION: 'Khôi phục câu hỏi', LOCK_EXAM_DISTRIBUTION: 'Chốt lịch thi',
  UNLOCK_EXAM_DISTRIBUTION: 'Mở lại lịch thi', AUTO_LOCK_EXAM_DISTRIBUTION: 'Tự động chốt đề',
  UPDATE_EXAM_STUDENT_VISIBILITY: 'Đổi hiển thị đề thi', EXTEND_EXAM_ATTEMPT: 'Gia hạn bài thi',
  AUTO_SUBMIT_EXAM_ATTEMPT: 'Tự động nộp bài', REVIEW_PROCTORING_VIOLATION: 'Xử lý vi phạm',
  INVALIDATE_EXAM_ATTEMPT_BY_PROCTOR: 'Hủy kết quả bài thi', OVERRIDE_EXAM_SCORE: 'Điều chỉnh điểm',
  UPDATE_SYSTEM_SETTINGS: 'Cập nhật cấu hình hệ thống', RESET_SYSTEM_SETTINGS: 'Khôi phục cài đặt gốc',
}

const entityLabels: Record<string, string> = {
  User: 'Người dùng', Student: 'Sinh viên', Teacher: 'Giảng viên', Exam: 'Đề thi', Question: 'Câu hỏi',
  QuestionBankItem: 'Câu hỏi dùng chung', CourseOffering: 'Lớp học phần', Material: 'Tài liệu', Post: 'Bài đăng',
  ExamSchedule: 'Ca thi', ExamAttempt: 'Bài làm', Violation: 'Vi phạm', SystemSettings: 'Cấu hình hệ thống',
}

export const roleLabels: Record<AuditActorRole, string> = {
  ADMIN: 'Quản trị viên', TEACHER: 'Giảng viên', STUDENT: 'Sinh viên', UNKNOWN: 'Không xác định',
}

const titleCaseAction = (action: string) => action.toLowerCase().split('_').map((word) =>
  word ? `${word[0].toUpperCase()}${word.slice(1)}` : word,
).join(' ')

export const getAuditActionLabel = (action: string) => actionLabels[action] ?? titleCaseAction(action)
export const getAuditEntityLabel = (entityType: string) => entityLabels[entityType] ?? entityType

export const getAuditActionTone = (action: string): 'gray' | 'blue' | 'emerald' | 'amber' | 'rose' => {
  if (/DELETE|REMOVE|INVALIDATE/.test(action)) return 'rose'
  if (/OVERRIDE|REJECT|VIOLATION|UNLOCK/.test(action)) return 'amber'
  if (/CREATE|APPROVE|RESTORE|LOGIN/.test(action)) return 'emerald'
  if (/UPDATE|LOCK|EXTEND|SUBMIT/.test(action)) return 'blue'
  return 'gray'
}
