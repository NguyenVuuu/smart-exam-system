import type { AccountRole } from '../../../utils/jwt'

export interface AuthenticatedUser {
  id: string        // User.id
  profileId: string // Admin.id | Teacher.id | Student.id
  role: AccountRole
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser
    }
  }
}
