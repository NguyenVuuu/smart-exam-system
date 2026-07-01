import 'express'
import type { AccountRole } from '../utils/jwt'

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string
        profileId: string
        role: AccountRole
      }
    }
  }
}
