import type { UserRole } from '../types/auth.types'

export const ROLE_LABEL: Record<UserRole, string> = {
  ADMIN: 'Quản trị viên',
  EDUCATION_OFFICER: 'Cán bộ đào tạo',
  TEACHER: 'Giảng viên',
  DEPARTMENT_HEAD: 'Trưởng bộ môn',
  STUDENT: 'Sinh viên',
}

/** Route home mặc định sau khi đăng nhập */
export const ROLE_HOME: Record<UserRole, string> = {
  STUDENT: '/(app)/(student)/dashboard',
  TEACHER: '/(app)/(teacher)/dashboard',
  DEPARTMENT_HEAD: '/(app)/(teacher)/dashboard',
  ADMIN: '/(app)/(admin)/dashboard',
  EDUCATION_OFFICER: '/(app)/(admin)/dashboard',
}
