import type { UserPermission, UserProfileDto } from '../dtos/auth.dto'
import type { AdminWithUser, StudentWithUser, TeacherWithUser } from '../repositories/auth.repository'

const DEPARTMENT_HEAD_PERMISSIONS: UserPermission[] = [
  'APPROVE_SHARED_QUESTION',
  'APPROVE_FINAL_EXAM',
  'VIEW_DEPARTMENT_EXAMS',
  'VIEW_DEPARTMENT_REPORTS',
]

function resolveTeacherPermissions(teacher: TeacherWithUser): UserPermission[] {
  return teacher.position === 'DEPARTMENT_HEAD' ? DEPARTMENT_HEAD_PERMISSIONS : []
}

export function toStudentProfileDto(student: StudentWithUser): UserProfileDto {
  return {
    id: student.user.id,
    profileId: student.id,
    fullName: student.user.fullName,
    email: student.user.email ?? null,
    avatarUrl: student.user.avatarUrl ?? null,
    role: 'STUDENT',
    studentCode: student.studentCode,
    teacherCode: null,
    adminCode: null,
  }
}

export function toTeacherProfileDto(teacher: TeacherWithUser): UserProfileDto {
  return {
    id: teacher.user.id,
    profileId: teacher.id,
    fullName: teacher.user.fullName,
    email: teacher.user.email ?? null,
    avatarUrl: teacher.user.avatarUrl ?? null,
    role: 'TEACHER',
    studentCode: null,
    teacherCode: teacher.teacherCode,
    adminCode: null,
    position: teacher.position,
    departmentId: teacher.departmentId,
    permissions: resolveTeacherPermissions(teacher),
  }
}

export function toAdminProfileDto(admin: AdminWithUser): UserProfileDto {
  return {
    id: admin.user.id,
    profileId: admin.id,
    fullName: admin.user.fullName,
    email: admin.user.email ?? null,
    avatarUrl: admin.user.avatarUrl ?? null,
    role: 'ADMIN',
    studentCode: null,
    teacherCode: null,
    adminCode: admin.adminCode,
  }
}
