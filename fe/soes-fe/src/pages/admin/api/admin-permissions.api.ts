import { apiClient } from '../../../api/axios'
import type { UserPermission } from '../../../types/auth.types'
import type { ApiResponse } from '../types/admin-api.types'

export interface PermissionItem {
  key: UserPermission
  label: string
  group: string
  module: string
  action: 'VIEW' | 'MANAGE'
  includedBy: UserPermission | null
}

export interface BackofficeAccount {
  id: string
  code: string
  fullName: string
  email: string | null
  role: 'ADMIN' | 'EDUCATION_OFFICER'
  status: 'ACTIVE' | 'INACTIVE'
  permissions: UserPermission[]
  overrides: Array<{ permission: UserPermission; allowed: boolean }>
}

export interface PermissionsWorkspace {
  catalog: PermissionItem[]
  roles: Array<{ role: 'ADMIN' | 'EDUCATION_OFFICER'; permissions: UserPermission[] }>
  accounts: BackofficeAccount[]
}

export const getPermissionsWorkspace = () => apiClient
  .get<ApiResponse<PermissionsWorkspace>>('/admin/permissions')
  .then(({ data }) => data.data)

export const getMyBackofficePermissions = () => apiClient
  .get<ApiResponse<{ permissions: UserPermission[] }>>('/admin/permissions/me')
  .then(({ data }) => data.data.permissions)

export const updatePermission = (
  accountId: string,
  permission: UserPermission,
  allowed: boolean | null,
  reason: string,
) => apiClient.put(`/admin/permissions/accounts/${accountId}/${permission}`, { allowed, reason })

export const updateRolePermission = (
  role: 'ADMIN' | 'EDUCATION_OFFICER',
  permission: UserPermission,
  allowed: boolean,
  reason: string,
) => apiClient.put(`/admin/permissions/roles/${role}/${permission}`, { allowed, reason })
