import bcrypt from 'bcrypt'
import { ForbiddenError, UnauthorizedError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'
import { signAccessToken, signRefreshToken, verifyRefreshToken, type JwtPayload } from '../../../utils/jwt'
import type { LoginRequestDto, LoginResponseDto, UserProfileDto } from '../dtos/auth.dto'
import { toAdminProfileDto, toStudentProfileDto, toTeacherProfileDto } from '../mappers/auth.mapper'
import * as repo from '../repositories/auth.repository'

// ── Helpers ───────────────────────────────────────────────

function buildJwtPayload(profile: UserProfileDto): JwtPayload {
  return {
    sub: profile.id,
    profileId: profile.profileId,
    role: profile.role,
  }
}

type ResolvedProfile = {
  profile: UserProfileDto
  password: string
  status: string
}

async function resolveProfile(identifier: string): Promise<ResolvedProfile | null> {
  const upper = identifier.toUpperCase()

  if (upper.startsWith('SV')) {
    const student = await repo.findStudentByCode(identifier)
    if (!student) return null
    return { profile: toStudentProfileDto(student), password: student.password, status: student.status }
  }

  if (upper.startsWith('GV')) {
    const teacher = await repo.findTeacherByCode(identifier)
    if (!teacher) return null
    return { profile: toTeacherProfileDto(teacher), password: teacher.password, status: teacher.status }
  }

  if (upper.startsWith('AD')) {
    const admin = await repo.findAdminByCode(identifier)
    if (!admin) return null
    return { profile: toAdminProfileDto(admin), password: admin.password, status: admin.status }
  }

  return null
}

// ── Service methods ───────────────────────────────────────

export async function login(dto: LoginRequestDto): Promise<LoginResponseDto> {
  const resolved = await resolveProfile(dto.identifier)

  if (!resolved) {
    logger.warn('Login failed: account not found', { identifier: dto.identifier })
    throw new UnauthorizedError('Invalid credentials')
  }

  if (resolved.status === 'INACTIVE') {
    logger.warn('Login failed: account inactive', { profileId: resolved.profile.profileId })
    throw new ForbiddenError('Your account is inactive')
  }

  const passwordMatch = await bcrypt.compare(dto.password, resolved.password)
  if (!passwordMatch) {
    logger.warn('Login failed: wrong password', { profileId: resolved.profile.profileId })
    throw new UnauthorizedError('Invalid credentials')
  }

  const payload = buildJwtPayload(resolved.profile)
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)

  logger.info('User logged in', { userId: resolved.profile.id, role: resolved.profile.role })

  return { accessToken, refreshToken, user: resolved.profile }
}

export async function refreshAccessToken(token: string): Promise<string> {
  let payload: JwtPayload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }

  // Verify the profile still exists and is active
  let status: string | undefined

  if (payload.role === 'STUDENT') {
    const s = await repo.findStudentByUserId(payload.sub)
    status = s?.status
  } else if (payload.role === 'TEACHER') {
    const t = await repo.findTeacherByUserId(payload.sub)
    status = t?.status
  } else {
    const a = await repo.findAdminByUserId(payload.sub)
    status = a?.status
  }

  if (!status || status === 'INACTIVE') {
    throw new UnauthorizedError('Invalid or expired refresh token')
  }

  return signAccessToken(payload)
}

export async function getMe(userId: string, role: string): Promise<UserProfileDto> {
  if (role === 'STUDENT') {
    const student = await repo.findStudentByUserId(userId)
    if (!student) throw new UnauthorizedError('User not found')
    return toStudentProfileDto(student)
  }

  if (role === 'TEACHER') {
    const teacher = await repo.findTeacherByUserId(userId)
    if (!teacher) throw new UnauthorizedError('User not found')
    return toTeacherProfileDto(teacher)
  }

  const admin = await repo.findAdminByUserId(userId)
  if (!admin) throw new UnauthorizedError('User not found')
  return toAdminProfileDto(admin)
}
