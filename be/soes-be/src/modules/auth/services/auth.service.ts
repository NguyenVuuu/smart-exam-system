import bcrypt from 'bcrypt'
import { User } from '@prisma/client'
import { ForbiddenError, UnauthorizedError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../../utils/jwt'
import { LoginRequestDto, LoginResponseDto } from '../dtos/auth.dto'
import { toUserProfileDto } from '../mappers/auth.mapper'
import * as authRepository from '../repositories/auth.repository'

function buildJwtPayload(user: User) {
    return {
        sub: user.id,
        isAdmin: user.isAdmin,
        studentCode: user.studentCode ?? null,
        teacherCode: user.teacherCode ?? null,
    }
}

async function resolveUser(identifier: string): Promise<User | null> {
    if (identifier.toUpperCase().startsWith('SV')) {
        return authRepository.findUserByStudentCode(identifier)
    }

    if (identifier.toUpperCase().startsWith('GV')) {
        return authRepository.findUserByTeacherCode(identifier)
    }

    // Treat as email — admin only
    const user = await authRepository.findUserByEmail(identifier)
    if (user && !user.isAdmin) return null
    return user
}

export async function login(dto: LoginRequestDto): Promise<LoginResponseDto> {
    const user = await resolveUser(dto.identifier)

    if (!user) {
        logger.warn('Login failed: user not found', { identifier: dto.identifier })
        throw new UnauthorizedError('Invalid credentials')
    }

    if (user.status === 'INACTIVE') {
        logger.warn('Login failed: account inactive', { userId: user.id })
        throw new ForbiddenError('Your account is inactive')
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password)
    if (!passwordMatch) {
        logger.warn('Login failed: wrong password', { userId: user.id })
        throw new UnauthorizedError('Invalid credentials')
    }

    const payload = buildJwtPayload(user)
    const accessToken = signAccessToken(payload)
    const refreshToken = signRefreshToken(payload)

    logger.info('User logged in', { userId: user.id })

    return {
        accessToken,
        refreshToken,
        user: toUserProfileDto(user),
    }
}

export async function refreshAccessToken(token: string): Promise<string> {
    let payload
    try {
        payload = verifyRefreshToken(token)
    } catch {
        throw new UnauthorizedError('Invalid or expired refresh token')
    }

    const user = await authRepository.findUserById(payload.sub)
    if (!user || user.status === 'INACTIVE') {
        throw new UnauthorizedError('Invalid or expired refresh token')
    }

    return signAccessToken(buildJwtPayload(user))
}

export async function getMe(userId: string) {
    const user = await authRepository.findUserById(userId)
    if (!user) throw new UnauthorizedError('User not found')
    return toUserProfileDto(user)
}
