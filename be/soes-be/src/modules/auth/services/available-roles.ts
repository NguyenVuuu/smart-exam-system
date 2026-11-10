import type { AccountRole } from '../../../utils/jwt'
import type { AvailableRoleDto } from '../dtos/auth.dto'
import type { UserWithProfiles } from '../repositories/auth.repository'

const ROLE_DISPLAY_NAMES: Record<AccountRole, string> = {
  ADMIN: 'Quản trị viên',
  EDUCATION_OFFICER: 'Giáo vụ',
  TEACHER: 'Giảng viên',
  DEPARTMENT_HEAD: 'Trưởng bộ môn',
  STUDENT: 'Sinh viên',
}

type TeacherProfile = UserWithProfiles['teachers'][number]

function teacherRole(teacher: TeacherProfile): AccountRole {
  return teacher.position === 'DEPARTMENT_HEAD' ? 'DEPARTMENT_HEAD' : 'TEACHER'
}

function teacherOption(teacher: TeacherProfile, code: string): AvailableRoleDto {
  const role = teacherRole(teacher)
  return {
    role,
    name: ROLE_DISPLAY_NAMES[role],
    profileId: teacher.id,
    code,
    position: teacher.position,
  }
}

export function resolveAvailableRoles(user: UserWithProfiles): AvailableRoleDto[] {
  const roles = new Set((user.roles as AccountRole[]) || [])
  const available: AvailableRoleDto[] = []
  const code = user.username ?? ''
  const teacher = user.teachers.find((profile) => profile.status === 'ACTIVE') ?? user.teachers[0]

  for (const role of roles) {
    if (role === 'STUDENT') {
      const student = user.students.find((profile) => profile.status === 'ACTIVE') ?? user.students[0]
      if (student) available.push({ role, name: ROLE_DISPLAY_NAMES[role], profileId: student.id, code })
    } else if (role === 'TEACHER' || role === 'DEPARTMENT_HEAD') {
      if (teacher && !available.some((option) => option.role === 'TEACHER' || option.role === 'DEPARTMENT_HEAD')) {
        available.push(teacherOption(teacher, code))
      }
    } else if (role === 'ADMIN' || role === 'EDUCATION_OFFICER') {
      const admin = user.admins.find((profile) => profile.role === role && profile.status === 'ACTIVE') ?? user.admins[0]
      if (admin) available.push({ role, name: ROLE_DISPLAY_NAMES[role], profileId: admin.id, code })
    }
  }

  // Older accounts may have profiles without a populated roles array.
  if (available.length === 0) {
    const student = user.students.find((profile) => profile.status === 'ACTIVE')
    if (student) available.push({ role: 'STUDENT', name: ROLE_DISPLAY_NAMES.STUDENT, profileId: student.id, code })
    const activeTeacher = user.teachers.find((profile) => profile.status === 'ACTIVE')
    if (activeTeacher) available.push(teacherOption(activeTeacher, code))
    const admin = user.admins.find((profile) => profile.status === 'ACTIVE')
    if (admin) {
      const role = admin.role as AccountRole
      available.push({ role, name: ROLE_DISPLAY_NAMES[role] ?? role, profileId: admin.id, code })
    }
  }

  return available
}
