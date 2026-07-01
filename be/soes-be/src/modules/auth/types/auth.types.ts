export interface AuthenticatedUser {
  id: string
  isAdmin: boolean
  studentCode: string | null
  teacherCode: string | null
}
