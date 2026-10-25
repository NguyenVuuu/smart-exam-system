import prisma from '../../../lib/prisma'
import type { BackofficeRole } from '@prisma/client'
import { MANAGE_REQUIRES_VIEW, permissionChangesWithDependencies, type BackofficePermission } from '../../auth/permissions/backoffice-permissions'

export const listRolePermissions = () => prisma.backofficeRolePermission.findMany({
  select: { role: true, permission: true },
})

export const listAccounts = () => prisma.admin.findMany({
  select: {
    id: true,
    adminCode: true,
    role: true,
    status: true,
    user: { select: { fullName: true, email: true } },
    permissionOverrides: { select: { permission: true, allowed: true } },
  },
  orderBy: { adminCode: 'asc' },
})

export const findAccountById = (adminId: string) => prisma.admin.findUnique({
  where: { id: adminId },
  select: { id: true, role: true },
})

export const updateOverride = (input: {
  adminId: string
  permission: BackofficePermission
  allowed: boolean | null
  reason: string
  actorUserId: string
  ipAddress?: string
  userAgent?: string
}) => prisma.$transaction(async (tx) => {
  const changes: Array<{ permission: BackofficePermission; allowed: boolean | null }> = [
    { permission: input.permission, allowed: input.allowed },
  ]
  const requiredView = MANAGE_REQUIRES_VIEW.find(([manage]) => manage === input.permission)?.[1]
  if (input.allowed === true && requiredView) {
    const viewOverride = await tx.adminPermissionOverride.findUnique({
      where: { adminId_permission: { adminId: input.adminId, permission: requiredView } },
      select: { allowed: true },
    })
    if (viewOverride?.allowed === false) changes.push({ permission: requiredView, allowed: null })
  }

  for (const change of changes) {
    const where = {
      adminId_permission: {
        adminId: input.adminId,
        permission: change.permission,
      },
    }
    const previous = await tx.adminPermissionOverride.findUnique({ where })

    if (change.allowed === null) {
      await tx.adminPermissionOverride.deleteMany({
        where: { adminId: input.adminId, permission: change.permission },
      })
    } else {
      await tx.adminPermissionOverride.upsert({
        where,
        create: { adminId: input.adminId, permission: change.permission, allowed: change.allowed },
        update: { allowed: change.allowed },
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'BACKOFFICE_PERMISSION_CHANGED',
        entityType: 'AdminPermissionOverride',
        entityId: input.adminId,
        userId: input.actorUserId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: {
          permission: change.permission,
          previous: previous?.allowed ?? null,
          allowed: change.allowed,
          requestedPermission: input.permission,
          reason: input.reason,
        },
      },
    })
  }

  return {
    accountId: input.adminId,
    permission: input.permission,
    allowed: input.allowed,
  }
})

export const updateRolePermission = (input: {
  role: BackofficeRole
  permission: BackofficePermission
  allowed: boolean
  reason: string
  actorUserId: string
  ipAddress?: string
  userAgent?: string
}) => prisma.$transaction(async (tx) => {
  for (const change of permissionChangesWithDependencies(input.permission, input.allowed)) {
    const where = { role_permission: { role: input.role, permission: change.permission } }
    const previous = await tx.backofficeRolePermission.findUnique({ where, select: { permission: true } })

    if (change.allowed) {
      await tx.backofficeRolePermission.upsert({
        where,
        create: { role: input.role, permission: change.permission },
        update: {},
      })
    } else {
      await tx.backofficeRolePermission.deleteMany({
        where: { role: input.role, permission: change.permission },
      })
    }

    await tx.auditLog.create({
      data: {
        action: 'BACKOFFICE_ROLE_PERMISSION_CHANGED',
        entityType: 'BackofficeRolePermission',
        entityId: input.role,
        userId: input.actorUserId,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        metadata: {
          permission: change.permission,
          previous: Boolean(previous),
          allowed: change.allowed,
          requestedPermission: input.permission,
          reason: input.reason,
        },
      },
    })
  }
})
