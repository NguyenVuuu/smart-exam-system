import jwt, { SignOptions } from 'jsonwebtoken'

export interface JwtPayload {
  sub: string
  isAdmin: boolean
  studentCode: string | null
  teacherCode: string | null
}

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET!
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET!
const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES = '7d'

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: ACCESS_EXPIRES }
  return jwt.sign(payload, ACCESS_SECRET, options)
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES }
  return jwt.sign(payload, REFRESH_SECRET, options)
}

export function verifyAccessToken(token: string): JwtPayload {
  return jwt.verify(token, ACCESS_SECRET) as JwtPayload
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, REFRESH_SECRET) as JwtPayload
}
