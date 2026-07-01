import jwt, { SignOptions } from 'jsonwebtoken'

export type AccountRole = 'ADMIN' | 'TEACHER' | 'STUDENT'

export interface JwtPayload {
  sub: string       // User.id
  profileId: string // Admin.id | Teacher.id | Student.id
  role: AccountRole
  jti?: string      // JWT ID — used for blacklisting on logout
}

// Secrets are read lazily (inside functions) so that dotenv has already
// loaded by the time any JWT operation is called. Reading them at module
// scope would capture `undefined` because ES imports are hoisted above
// the `import 'dotenv/config'` side-effect in server.ts.
function getAccessSecret(): string {
  const secret = process.env.JWT_ACCESS_SECRET
  if (!secret) throw new Error('JWT_ACCESS_SECRET is not set')
  return secret
}

function getRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET
  if (!secret) throw new Error('JWT_REFRESH_SECRET is not set')
  return secret
}

const ACCESS_EXPIRES = '15m'
const REFRESH_EXPIRES = '7d'

export function signAccessToken(payload: JwtPayload): string {
  const options: SignOptions = {
    expiresIn: ACCESS_EXPIRES,
    jwtid: crypto.randomUUID(), // unique jti for blacklisting
  }
  return jwt.sign(payload, getAccessSecret(), options)
}

export function signRefreshToken(payload: JwtPayload): string {
  const options: SignOptions = { expiresIn: REFRESH_EXPIRES }
  return jwt.sign(payload, getRefreshSecret(), options)
}

export function verifyAccessToken(token: string): JwtPayload & { jti: string; exp: number } {
  return jwt.verify(token, getAccessSecret()) as JwtPayload & { jti: string; exp: number }
}

export function verifyRefreshToken(token: string): JwtPayload {
  return jwt.verify(token, getRefreshSecret()) as JwtPayload
}
