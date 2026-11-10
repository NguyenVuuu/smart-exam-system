import type { Prisma } from '@prisma/client'
import type { AdminUserDto } from '../dtos/admin-user.dto'
import type { userSelect } from '../repositories/admin-users.repository'

type UserRow = Prisma.UserGetPayload<{ select: typeof userSelect }>

export function toAdminUserDto(user: UserRow, role?: AdminUserDto['role']): AdminUserDto {
  const admin = role === 'TEACHER' || role === 'STUDENT'
    ? undefined : user.admins.find((profile) => !role || profile.role === role)
  const teacher = role === 'ADMIN' || role === 'EDUCATION_OFFICER' || role === 'STUDENT'
    ? undefined : user.teachers[0]
  const student = user.students[0]
  if (admin) return {
    id: user.id, profileId: admin.id, code: user.username ?? '',
    fullName: user.fullName, email: user.email ?? null, phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null, role: admin.role, status: admin.status,
    position: null, department: null, faceEnrollment: null,
  }
  if (teacher) return {
    id: user.id, profileId: teacher.id, code: user.username ?? '',
    fullName: user.fullName, email: user.email ?? null, phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null, role: 'TEACHER', status: teacher.status,
    position: teacher.position, department: teacher.department, faceEnrollment: null,
  }
  return {
    id: user.id, profileId: student!.id, code: user.username ?? '',
    fullName: user.fullName, email: user.email ?? null, phoneNumber: user.phoneNumber ?? null,
    avatarUrl: user.avatarUrl ?? null, role: 'STUDENT', status: student!.status,
    position: null, department: null,
    faceEnrollment: student!.faceProfile ? {
      status: student!.faceProfile.status,
      enrolledAt: student!.faceProfile.enrolledAt,
      revokedAt: student!.faceProfile.revokedAt,
      imageAvailable: student!.faceProfile.status === 'ACTIVE' && !!student!.faceProfile.referenceImageCapturedAt,
      cleanupPending: student!.faceProfile.status === 'REVOKED' && !!student!.faceProfile.providerFaceId,
    } : null,
  }
}
