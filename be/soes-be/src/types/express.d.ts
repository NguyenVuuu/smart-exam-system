import 'express'
import type { AccountRole } from '../utils/jwt'
import type { BackofficePermission } from '../modules/auth/permissions/backoffice-permissions'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        profileId: string
        role: AccountRole
      }
      backofficePermissions?: BackofficePermission[]
    }
  }
}
