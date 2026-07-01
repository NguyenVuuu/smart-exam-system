export interface LoginRequestDto {
  identifier: string
  password: string
}

export interface UserProfileDto {
  id: string
  fullName: string
  email: string | null
  studentCode: string | null
  teacherCode: string | null
  isAdmin: boolean
  avatarUrl: string | null
}

export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: UserProfileDto
}
