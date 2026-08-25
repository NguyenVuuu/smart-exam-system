import type { AccountRole } from '../../../utils/jwt'

export type TeacherPosition = 'LECTURER' | 'DEPARTMENT_HEAD'
export type UserPermission =
  | 'APPROVE_SHARED_QUESTION'
  | 'APPROVE_FINAL_EXAM'
  | 'VIEW_DEPARTMENT_EXAMS'
  | 'VIEW_DEPARTMENT_REPORTS'

export interface LoginRequestDto {
  identifier: string
  password: string
}

export interface UserProfileDto {
  id: string
  profileId: string
  fullName: string
  email: string | null
  avatarUrl: string | null
  role: AccountRole
  // role-specific codes
  studentCode: string | null
  teacherCode: string | null
  adminCode: string | null
  position?: TeacherPosition
  departmentId?: string | null
  permissions?: UserPermission[]
}

export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: UserProfileDto
}
