/// <reference path="../../../types/express.d.ts" />
import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../../../errors/AppError'
import { verifyAccessToken } from '../../../utils/jwt'
import { tokenBlacklist } from '../../../lib/redis'

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing or invalid authorization header')
    }

    const token = authHeader.slice(7)
    const payload = verifyAccessToken(token)

    // Reject if this token has been blacklisted (e.g. after logout)
    const blacklisted = await tokenBlacklist.isBlacklisted(payload.jti)
    if (blacklisted) {
      throw new UnauthorizedError('Token has been revoked')
    }

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
