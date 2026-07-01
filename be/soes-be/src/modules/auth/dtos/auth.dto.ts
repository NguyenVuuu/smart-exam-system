import type { AccountRole } from '../../../utils/jwt'

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
}

export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: UserProfileDto
}
