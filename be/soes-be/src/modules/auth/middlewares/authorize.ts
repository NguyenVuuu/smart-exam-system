import { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../../../errors/AppError'
import type { AccountRole } from '../../../utils/jwt'

function guardAuthenticated(req: Request): void {
  if (!req.user) throw new UnauthorizedError()
}

export function requireAdmin() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      guardAuthenticated(req)
      if (req.user!.role !== 'ADMIN') throw new ForbiddenError('Admin access required')
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requireStudent() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      guardAuthenticated(req)
      if (req.user!.role !== 'STUDENT') throw new ForbiddenError('Student access required')
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requireTeacher() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      guardAuthenticated(req)
      if (req.user!.role !== 'TEACHER') throw new ForbiddenError('Teacher access required')
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requireRoles(...roles: AccountRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      guardAuthenticated(req)
      if (!roles.includes(req.user!.role)) {
        throw new ForbiddenError(`Access restricted to: ${roles.join(', ')}`)
      }
      next()
    } catch (err) {
      next(err)
    }
  }
}
