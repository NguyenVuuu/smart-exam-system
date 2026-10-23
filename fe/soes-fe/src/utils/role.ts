import type { User, UserRole } from '../types/auth.types'

export function resolveRole(user: User): UserRole {
  return user.role
}

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  EDUCATION_OFFICER: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
}
