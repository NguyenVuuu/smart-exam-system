import type { User, UserRole } from '../types/auth.types'

export function resolveRole(user: User): UserRole {
  if (user.isAdmin) return 'ADMIN'
  if (user.teacherCode) return 'TEACHER'
  return 'STUDENT'
}

// When identifier is known (at login time), use it to determine intended role.
// This handles the case where a user has both studentCode and teacherCode.
export function resolveRoleFromIdentifier(identifier: string, user: User): UserRole {
  if (user.isAdmin) return 'ADMIN'
  if (identifier.toUpperCase().startsWith('GV')) return 'TEACHER'
  if (identifier.toUpperCase().startsWith('SV')) return 'STUDENT'
  return resolveRole(user)
}

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
}
