export interface AdminUserDto {
  id: string; profileId: string; code: string; fullName: string
  email: string | null; phoneNumber: string | null; avatarUrl: string | null
  role: 'ADMIN' | 'TEACHER' | 'STUDENT'; status: string
  position: string | null
  department: { id: string; code: string; name: string } | null
}
