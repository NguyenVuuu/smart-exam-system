import { Response } from 'express'

const REFRESH_TOKEN_COOKIE = 'refreshToken'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export function setRefreshTokenCookie(res: Response, token: string): void {
  res.cookie(REFRESH_TOKEN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: SEVEN_DAYS_MS,
  })
}

export function clearRefreshTokenCookie(res: Response): void {
  res.clearCookie(REFRESH_TOKEN_COOKIE, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  })
}
