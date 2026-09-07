/// <reference path="../../../types/express.d.ts" />
import { NextFunction, Request, Response } from 'express'
import { UnauthorizedError } from '../../../errors/AppError'
import { verifyAccessToken } from '../../../utils/jwt'
import { tokenBlacklist } from '../../../lib/redis'

export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    let token: string | undefined
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7)
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken
    } else if (typeof req.query?.token === 'string') {
      token = req.query.token
    }

    if (!token) {
      throw new UnauthorizedError('Missing or invalid authorization header')
    }

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
