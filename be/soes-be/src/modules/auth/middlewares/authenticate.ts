/// <reference path="../../../types/express.d.ts" />
import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../../../errors/AppError'
import { verifyAccessToken } from '../../../utils/jwt'

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header')
    }

    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)

    req.user = {
      id: payload.sub,
      profileId: payload.profileId,
      role: payload.role,
    }

    next()
  } catch (err) {
    next(err)
  }
}
