export type UserRole = 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT'
export type TeacherPosition = 'LECTURER' | 'DEPARTMENT_HEAD'
export type UserPermission =
  | 'ACADEMIC_VIEW'
  | 'ACADEMIC_MANAGE'
  | 'USERS_VIEW'
  | 'USERS_MANAGE'
  | 'QUESTION_BANK_VIEW'
  | 'QUESTION_BANK_MANAGE'
  | 'EXAMS_VIEW'
  | 'SCHEDULES_VIEW'
  | 'SCHEDULES_MANAGE'
  | 'MONITORING_VIEW'
  | 'REPORTS_VIEW'
  | 'AUDIT_VIEW'
  | 'SETTINGS_VIEW'
  | 'SETTINGS_MANAGE'
  | 'APPROVE_SHARED_QUESTION'
  | 'APPROVE_FINAL_EXAM'
  | 'VIEW_DEPARTMENT_EXAMS'
  | 'VIEW_DEPARTMENT_REPORTS'

export interface User {
  id: string
  profileId: string
  fullName: string
  email: string | null
  phoneNumber?: string | null
  avatarUrl: string | null
  role: UserRole
  studentCode: string | null
  teacherCode: string | null
  adminCode: string | null
  position?: TeacherPosition
  departmentId?: string
  permissions?: UserPermission[]
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}
