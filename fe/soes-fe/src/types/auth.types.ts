export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'
export type TeacherPosition = 'LECTURER' | 'DEPARTMENT_HEAD'
export type UserPermission =
  | 'APPROVE_SHARED_QUESTION'
  | 'APPROVE_FINAL_EXAM'
  | 'VIEW_DEPARTMENT_EXAMS'
  | 'VIEW_DEPARTMENT_REPORTS'

export interface User {
  id: string
  profileId: string
  fullName: string
  email: string | null
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
