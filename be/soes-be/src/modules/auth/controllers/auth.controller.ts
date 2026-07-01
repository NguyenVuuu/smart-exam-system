import { NextFunction, Request, Response } from 'express'
import { clearRefreshTokenCookie, setRefreshTokenCookie } from '../../../utils/cookie'
import { loginSchema } from '../validators/auth.validator'
import * as authService from '../services/auth.service'
import { UnauthorizedError } from '../../../errors/AppError'

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const dto = loginSchema.parse(req.body)
    const result = await authService.login(dto)

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
    next(err)
  }
}

export async function logout(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    clearRefreshTokenCookie(res)
    res.status(200).json({ success: true, message: 'Logged out successfully' })
  } catch (err) {
    next(err)
  }
}

export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await authService.getMe(req.user!.id)
    res.status(200).json({ success: true, message: 'OK', data: user })
  } catch (err) {
    next(err)
  }
}
