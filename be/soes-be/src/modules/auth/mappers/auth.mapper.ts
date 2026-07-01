import { User } from '@prisma/client'
import { UserProfileDto } from '../dtos/auth.dto'

export function toUserProfileDto(user: User): UserProfileDto {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email ?? null,
    studentCode: user.studentCode ?? null,
    teacherCode: user.teacherCode ?? null,
    isAdmin: user.isAdmin,
    avatarUrl: user.avatarUrl ?? null,
  }
}
