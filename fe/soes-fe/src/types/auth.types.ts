export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

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
}

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}
