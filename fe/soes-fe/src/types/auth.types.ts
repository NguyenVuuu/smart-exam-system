export interface User {
  id: string
  fullName: string
  email: string | null
  studentCode: string | null
  teacherCode: string | null
  isAdmin: boolean
  avatarUrl: string | null
}

export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface LoginRequest {
  identifier: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  user: User
}

export interface RefreshTokenResponse {
  accessToken: string
}
