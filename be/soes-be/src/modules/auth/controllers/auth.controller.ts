import { NextFunction, Request, Response } from 'express'
import { clearRefreshTokenCookie, setRefreshTokenCookie } from '../../../utils/cookie'
import { authenticate } from '../middlewares/authenticate'
import { changePasswordSchema, loginSchema, selectRoleSchema, updateMeSchema } from '../validators/auth.validator'
import * as authService from '../services/auth.service'
import { UnauthorizedError } from '../../../errors/AppError'
import type { AccountRole } from '../../../utils/jwt'

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = loginSchema.parse(req.body)
    const result = await authService.login(dto)

    if ('requireRoleSelection' in result) {
      // Multi-role: return available roles, do NOT set cookie yet
      res.status(200).json({
        success: true,
        message: 'Role selection required',
        data: result,
      })
      return
    }

    // Single role: set cookie and return tokens
    setRefreshTokenCookie(res, result.refreshToken)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function requestRoleSwitch(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' })
      return
    }
    const data = await authService.requestRoleSwitch(req.user.id)
    res.json({ success: true, message: 'Role switch token issued', data })
  } catch (err) {
    next(err)
  }
}

export async function selectRole(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = selectRoleSchema.parse(req.body)
    const result = await authService.selectRole(dto)

    setRefreshTokenCookie(res, result.refreshToken)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    })
  } catch (err) {
    next(err)
  }
}

export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const token: string | undefined = req.cookies?.refreshToken
    if (!token) throw new UnauthorizedError('Refresh token not found')

    const accessToken = await authService.refreshAccessToken(token)

    res.status(200).json({
      success: true,
      message: 'Token refreshed',
      data: { accessToken },
    })
  } catch (err) {
    clearRefreshTokenCookie(res)
    next(err)
  }
}

// logout requires authentication so we know which user is logging out
export const logout = [
  authenticate,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const accessToken = req.headers.authorization!.slice(7)
      const userId = req.user!.id

      await authService.logout(accessToken, userId)

      clearRefreshTokenCookie(res)
      res.status(200).json({ success: true, message: 'Logged out successfully' })
    } catch (err) {
      next(err)
    }
  },
]

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, role } = req.user!
    const user = await authService.getMe(id, role as AccountRole)
    res.status(200).json({ success: true, message: 'OK', data: user })
  } catch (err) {
    next(err)
  }
}

export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, role } = req.user!
    const user = await authService.updateMe(id, role as AccountRole, updateMeSchema.parse(req.body))
    res.status(200).json({ success: true, message: 'Profile updated', data: user })
  } catch (err) {
    next(err)
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id, profileId, role } = req.user!
    await authService.changePassword(id, profileId, role as AccountRole, changePasswordSchema.parse(req.body))
    res.status(200).json({ success: true, message: 'Password changed' })
  } catch (err) {
    next(err)
  }
}
