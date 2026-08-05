import type { MemberRole } from '../types/student-course-detail.types'

export interface MemberResponseDto {
  memberId: string
  role: MemberRole
  fullName: string
  studentCode?: string | null
}
