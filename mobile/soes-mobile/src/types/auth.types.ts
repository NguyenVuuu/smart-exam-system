export type UserRole =
  | 'ADMIN'
  | 'EDUCATION_OFFICER'
  | 'TEACHER'
  | 'DEPARTMENT_HEAD'
  | 'STUDENT'

export interface User {
  id: string
  profileId: string
  role: UserRole
  fullName: string
  email: string | null
  phoneNumber: string | null
  avatarUrl: string | null
  studentCode: string | null
  teacherCode: string | null
  adminCode: string | null
  availableRoles: UserRole[]
}

export interface AvailableRole {
  role: UserRole
  name: string
  profileId: string
  code: string
  position?: string
}

export interface RoleSelectionRequired {
  requireRoleSelection: true
  selectionToken: string
  availableRoles: AvailableRole[]
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface LoginRequest {
  username: string
  password: string
}

export interface SelectRoleRequest {
  selectionToken: string
  role: UserRole
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}
