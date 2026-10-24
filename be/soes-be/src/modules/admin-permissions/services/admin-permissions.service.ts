import { ForbiddenError, NotFoundError } from '../../../errors/AppError'
import type { BackofficeRole } from '@prisma/client'
import {
  BACKOFFICE_PERMISSION_CATALOG,
  MANAGE_REQUIRES_VIEW,
  resolveBackofficePermissions,
  type BackofficePermission,
} from '../../auth/permissions/backoffice-permissions'
import * as repository from '../repositories/admin-permissions.repository'

export const catalog = BACKOFFICE_PERMISSION_CATALOG.map((item) => ({
  ...item,
  includedBy: MANAGE_REQUIRES_VIEW.find(([, view]) => view === item.key)?.[0] ?? null,
}))

export async function listWorkspace() {
  const [accounts, rolePermissions] = await Promise.all([
    repository.listAccounts(),
    repository.listRolePermissions(),
  ])
  const roles: BackofficeRole[] = ['ADMIN', 'EDUCATION_OFFICER']
  return {
    catalog,
    roles: roles.map((role) => ({
      role,
      permissions: resolveBackofficePermissions(rolePermissions.filter((item) => item.role === role), []),
    })),
    accounts: accounts.map((account) => ({
      id: account.id,
      code: account.adminCode,
      fullName: account.user.fullName,
      email: account.user.email,
      role: account.role,
      status: account.status,
      permissions: resolveBackofficePermissions(
        rolePermissions.filter((item) => item.role === account.role),
        account.permissionOverrides,
      ),
      overrides: account.permissionOverrides.map(({ permission, allowed }) => ({ permission, allowed })),
    })),
  }
}

export async function updateOverride(input: {
  adminId: string
  permission: BackofficePermission
  allowed: boolean | null
  reason: string
  actorUserId: string
  ipAddress?: string
  userAgent?: string
}) {
  const account = await repository.findAccountById(input.adminId)
  if (!account) throw new NotFoundError('Backoffice account not found')
  if (input.permission === 'REVIEW_GROUP_MANAGE_ALL' && input.allowed === true && account.role !== 'ADMIN') {
    throw new ForbiddenError('Review group support is reserved for Admin accounts')
  }

  return repository.updateOverride(input)
}

export function updateRolePermission(input: Parameters<typeof repository.updateRolePermission>[0]) {
  if (input.permission === 'REVIEW_GROUP_MANAGE_ALL' && input.allowed && input.role !== 'ADMIN') {
    throw new ForbiddenError('Review group support is reserved for the Admin role')
  }
  return repository.updateRolePermission(input)
}
