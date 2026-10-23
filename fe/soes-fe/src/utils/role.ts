import type { User, UserRole } from '../types/auth.types'

export function resolveRole(user: User): UserRole {
  return user.role
}

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  EDUCATION_OFFICER: '/admin',
  TEACHER: '/teacher',
  DEPARTMENT_HEAD: '/teacher',
  STUDENT: '/student',
}

/** Human-readable label for each role shown on role-selection screen */
export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  EDUCATION_OFFICER: 'Giáo vụ',
  TEACHER: 'Giảng viên',
  DEPARTMENT_HEAD: 'Trưởng bộ môn',
  STUDENT: 'Sinh viên',
}

/** Icon key per role (used with lucide-react in RoleSelectPage) */
export const ROLE_ICON_KEY: Record<UserRole, string> = {
  ADMIN: 'shield',
  EDUCATION_OFFICER: 'clipboard-list',
  TEACHER: 'graduation-cap',
  DEPARTMENT_HEAD: 'user-check',
  STUDENT: 'book-open',
}
