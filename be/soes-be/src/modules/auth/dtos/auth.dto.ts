import type { AccountRole } from '../../../utils/jwt'
import type { BackofficePermission } from '../permissions/backoffice-permissions'

export type TeacherPosition = 'LECTURER' | 'DEPARTMENT_HEAD'
export type UserPermission =
  | BackofficePermission
  | 'APPROVE_SHARED_QUESTION'
  | 'APPROVE_FINAL_EXAM'
  | 'VIEW_DEPARTMENT_EXAMS'
  | 'VIEW_DEPARTMENT_REPORTS'

export interface LoginRequestDto {
  username: string
  password: string
}

export interface SelectRoleRequestDto {
  /** Opaque short-lived token issued after credential verification (stored in Redis) */
  selectionToken: string
  /** The role the user wants to log in as */
  role: AccountRole
}

export interface UserProfileDto {
  id: string
  profileId: string
  fullName: string
  email: string | null
  phoneNumber: string | null
  avatarUrl: string | null
  role: AccountRole
  // role-specific codes
  studentCode: string | null
  teacherCode: string | null
  adminCode: string | null
  position?: TeacherPosition
  departmentId?: string | null
  permissions?: UserPermission[]
  availableRoles?: AccountRole[]
}

/**
 * Returned when user has a single role — login completes immediately.
 */
export interface LoginResponseDto {
  accessToken: string
  refreshToken: string
  user: UserProfileDto
}

/**
 * Summary of one available role shown on the role-selection screen.
 */
export interface AvailableRoleDto {
  role: AccountRole
  name?: string
  profileId: string
  /** Display code for the role (studentCode | teacherCode | adminCode) */
  code: string
  position?: TeacherPosition
}

/**
 * Returned when user has multiple roles — client must call /auth/select-role.
 */
export interface RoleSelectionRequiredDto {
  requireRoleSelection: true
  selectionToken: string
  availableRoles: AvailableRoleDto[]
  /** Basic user info to display on the role-select screen */
  user: {
    id: string
    fullName: string
    avatarUrl: string | null
  }
}

export type LoginApiResponseDto = LoginResponseDto | RoleSelectionRequiredDto
