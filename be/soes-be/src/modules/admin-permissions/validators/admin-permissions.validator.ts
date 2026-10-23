import { z } from 'zod'
import {
  BACKOFFICE_PERMISSION_CATALOG,
  type BackofficePermission,
} from '../../auth/permissions/backoffice-permissions'

const permissionKeys = BACKOFFICE_PERMISSION_CATALOG.map(({ key }) => key) as [
  BackofficePermission,
  ...BackofficePermission[],
]

export const updatePermissionBodySchema = z.object({
  allowed: z.boolean().nullable(),
  reason: z.string().trim().min(3).max(500),
})

export const updatePermissionParamsSchema = z.object({
  adminId: z.string().uuid(),
  permission: z.enum(permissionKeys),
})

export const updateRolePermissionParamsSchema = z.object({
  role: z.enum(['ADMIN', 'EDUCATION_OFFICER']),
  permission: z.enum(permissionKeys),
})

export const updateRolePermissionBodySchema = z.object({
  allowed: z.boolean(),
  reason: z.string().trim().min(3).max(500),
})
