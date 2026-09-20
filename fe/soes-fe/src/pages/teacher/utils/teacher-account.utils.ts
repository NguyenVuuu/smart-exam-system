import type { TeacherPosition } from '../../../types/auth.types'

export function getTeacherInitials(fullName?: string | null): string {
  const nameParts = fullName?.trim().split(/\s+/).filter(Boolean) ?? []
  if (nameParts.length === 0) return 'GV'
  if (nameParts.length === 1) return nameParts[0].slice(0, 2).toUpperCase()

  return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
}

export function getTeacherPositionLabel(position?: TeacherPosition): string {
  return position === 'DEPARTMENT_HEAD' ? 'Trưởng bộ môn' : 'Giảng viên'
}
