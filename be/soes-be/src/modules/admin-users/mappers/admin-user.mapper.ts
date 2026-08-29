import type { Prisma } from '@prisma/client'
import type { AdminUserDto } from '../dtos/admin-user.dto'
import type { userSelect } from '../repositories/admin-users.repository'

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>

export function toAdminUserDto(user: UserRow): AdminUserDto {
  if (user.admin) return {
    id: user.id, profileId: user.admin.id, code: user.admin.adminCode,
    fullName: user.fullName, email: user.email ?? null, phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null, role: 'ADMIN', status: user.admin.status,
    position: null, department: null,
  }
  if (user.teacher) return {
    id: user.id, profileId: user.teacher.id, code: user.teacher.teacherCode,
    fullName: user.fullName, email: user.email ?? null, phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null, role: 'TEACHER', status: user.teacher.status,
    position: user.teacher.position, department: user.teacher.department,
  }
  return {
    id: user.id, profileId: user.student!.id, code: user.student!.studentCode,
    fullName: user.fullName, email: user.email ?? null, phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null, role: 'STUDENT', status: user.student!.status,
    position: null, department: null,
  }
}
