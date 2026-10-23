import type { NextFunction, Request, Response } from 'express'
import prisma from '../../../lib/prisma'
import { ForbiddenError, UnauthorizedError } from '../../../errors/AppError'
import { resolveBackofficePermissions, type BackofficePermission } from '../permissions/backoffice-permissions'

export function requireBackoffice(...anyOf: BackofficePermission[]) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) throw new UnauthorizedError()
      if (req.user.role !== 'ADMIN' && req.user.role !== 'EDUCATION_OFFICER') {
        throw new ForbiddenError('Backoffice access required')
      }
      const account = await prisma.admin.findUnique({
        where: { id: req.user.profileId },
        select: {
          userId: true,
          status: true,
          role: true,
          permissionOverrides: { select: { permission: true, allowed: true } },
        },
      })
      if (
        !account ||
        account.userId !== req.user.id ||
        account.status !== 'ACTIVE' ||
        account.role !== req.user.role
      ) {
        throw new ForbiddenError('Backoffice account is not active')
      }
      const rolePermissions = await prisma.backofficeRolePermission.findMany({
        where: { role: account.role },
        select: { permission: true },
      })
      const permissions = resolveBackofficePermissions(rolePermissions, account.permissionOverrides)
      if (anyOf.length && !anyOf.some((permission) => permissions.includes(permission))) {
        throw new ForbiddenError('Permission required')
      }
      req.backofficePermissions = permissions
      next()
    } catch (error) {
      next(error)
    }
  }
}
