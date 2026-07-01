import { NextFunction, Request, Response } from 'express'
import { ForbiddenError, UnauthorizedError } from '../../../errors/AppError'

function guardAuthenticated(req: Request): void {
  if (!req.user) throw new UnauthorizedError()
}

export function requireAdmin() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      guardAuthenticated(req)
      if (!req.user!.isAdmin) throw new ForbiddenError('Admin access required')
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
      if (!req.user!.studentCode) throw new ForbiddenError('Student access required')
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
      if (!req.user!.teacherCode) throw new ForbiddenError('Teacher access required')
      next()
    } catch (err) {
      next(err)
    }
  }
}

export function requireAdminOrTeacher() {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      guardAuthenticated(req)
      const { isAdmin, teacherCode } = req.user!
      if (!isAdmin && !teacherCode) throw new ForbiddenError('Admin or Teacher access required')
      next()
    } catch (err) {
      next(err)
    }
  }
}
