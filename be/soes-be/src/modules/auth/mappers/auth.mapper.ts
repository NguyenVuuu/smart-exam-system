import type { UserPermission, UserProfileDto } from '../dtos/auth.dto'
import type { AdminWithUser, StudentWithUser, TeacherWithUser } from '../repositories/auth.repository'
import { resolveBackofficePermissions } from '../permissions/backoffice-permissions'
import type { AccountRole } from '../../../utils/jwt'

export const DEPARTMENT_HEAD_PERMISSIONS: UserPermission[] = [
  'APPROVE_SHARED_QUESTION',
  'APPROVE_FINAL_EXAM',
  'VIEW_DEPARTMENT_EXAMS',
  'VIEW_DEPARTMENT_REPORTS',
]

function resolveTeacherRole(teacher: TeacherWithUser): AccountRole {
  return teacher.position === 'DEPARTMENT_HEAD' ? 'DEPARTMENT_HEAD' : 'TEACHER'
}

function resolveTeacherPermissions(teacher: TeacherWithUser, role?: AccountRole): UserPermission[] {
  const effectiveRole = role ?? resolveTeacherRole(teacher)
  return effectiveRole === 'DEPARTMENT_HEAD' ? DEPARTMENT_HEAD_PERMISSIONS : []
}

export function toStudentProfileDto(student: StudentWithUser, availableRoles?: AccountRole[]): UserProfileDto {
  return {
    id: student.user.id,
    profileId: student.id,
    fullName: student.user.fullName,
    email: student.user.email ?? null,
    phoneNumber: student.user.phoneNumber ?? null,
    avatarUrl: student.user.avatarUrl ?? null,
    role: 'STUDENT',
    studentCode: student.user.username ?? null,
    teacherCode: student.user.username ?? null,
    adminCode: student.user.username ?? null,
    availableRoles,
  }
}

export function toTeacherProfileDto(
  teacher: TeacherWithUser,
  overrideRole?: AccountRole,
  availableRoles?: AccountRole[],
): UserProfileDto {
  const role = overrideRole ?? resolveTeacherRole(teacher)
  return {
    id: teacher.user.id,
    profileId: teacher.id,
    fullName: teacher.user.fullName,
    email: teacher.user.email ?? null,
    phoneNumber: teacher.user.phoneNumber ?? null,
    avatarUrl: teacher.user.avatarUrl ?? null,
    role,
    studentCode: teacher.user.username ?? null,
    teacherCode: teacher.user.username ?? null,
    adminCode: teacher.user.username ?? null,
    position: teacher.position,
    departmentId: teacher.departmentId,
    permissions: resolveTeacherPermissions(teacher, role),
    availableRoles,
  }
}

export function toAdminProfileDto(
  admin: AdminWithUser,
  rolePermissions: ReadonlyArray<{ permission: string }>,
  availableRoles?: AccountRole[],
): UserProfileDto {
  return {
    id: admin.user.id,
    profileId: admin.id,
    fullName: admin.user.fullName,
    email: admin.user.email ?? null,
    phoneNumber: admin.user.phoneNumber ?? null,
    avatarUrl: admin.user.avatarUrl ?? null,
    role: admin.role as AccountRole,
    studentCode: admin.user.username ?? null,
    teacherCode: admin.user.username ?? null,
    adminCode: admin.user.username ?? null,
    permissions: resolveBackofficePermissions(rolePermissions, admin.permissionOverrides),
    availableRoles,
  }
}

