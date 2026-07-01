import type { User, UserRole } from '../types/auth.types'

export function resolveRole(user: User): UserRole {
  return user.role
}

// At login time, use the identifier prefix to decide redirect
// for users who have both student and teacher profiles.
export function resolveRoleFromIdentifier(identifier: string, user: User): UserRole {
  if (identifier.toUpperCase().startsWith('GV')) return 'TEACHER'
  if (identifier.toUpperCase().startsWith('SV')) return 'STUDENT'
  if (identifier.toUpperCase().startsWith('AD')) return 'ADMIN'
  return user.role
}

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: '/admin',
  TEACHER: '/teacher',
  STUDENT: '/student',
}
