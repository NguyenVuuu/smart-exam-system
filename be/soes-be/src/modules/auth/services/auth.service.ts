import bcrypt from 'bcrypt'
import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'
import redis, { refreshTokenStore, tokenBlacklist } from '../../../lib/redis'
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  type JwtPayload,
  type AccountRole,
} from '../../../utils/jwt'
import type {
  AvailableRoleDto,
  LoginApiResponseDto,
  LoginRequestDto,
  LoginResponseDto,
  RoleSelectionRequiredDto,
  SelectRoleRequestDto,
  UserProfileDto,
} from '../dtos/auth.dto'
import { toAdminProfileDto, toStudentProfileDto, toTeacherProfileDto } from '../mappers/auth.mapper'
import type { ChangePasswordInput, UpdateMeInput } from '../validators/auth.validator'
import * as repo from '../repositories/auth.repository'
import type { UserWithProfiles } from '../repositories/auth.repository'

// ── Constants ─────────────────────────────────────────────────────────────────

const REFRESH_TTL_SECONDS = 7 * 24 * 60 * 60 // 7 days
const SELECTION_TOKEN_TTL = 5 * 60             // 5 minutes
const SALT_ROUNDS = 10

// Redis key prefix for short-lived role-selection sessions
const SELECTION_PREFIX = 'role_sel:'

/** Entry stored in Redis during role-selection flow */
interface SelectionEntry {
  userId: string
  roles: AccountRole[]
  /** 'LOGIN' = đăng nhập thông thường; 'ROLE_SWITCH' = chuyển vai trò trong phiên */
  source: 'LOGIN' | 'ROLE_SWITCH'
}

const ROLE_DISPLAY_NAMES: Record<AccountRole, string> = {
  ADMIN: 'Quản trị viên',
  EDUCATION_OFFICER: 'Giáo vụ',
  TEACHER: 'Giảng viên',
  DEPARTMENT_HEAD: 'Trưởng bộ môn',
  STUDENT: 'Sinh viên',
}

// ── Internal helpers ──────────────────────────────────────────────────────────

function buildJwtPayload(profile: UserProfileDto): JwtPayload {
  return { sub: profile.id, profileId: profile.profileId, role: profile.role }
}

function sessionKey(userId: string, role: AccountRole): string {
  return `${userId}:${role}`
}

async function issueTokens(profile: UserProfileDto): Promise<LoginResponseDto> {
  const payload = buildJwtPayload(profile)
  const accessToken = signAccessToken(payload)
  const refreshToken = signRefreshToken(payload)
  const sKey = sessionKey(profile.id, profile.role)

  // Student: enforce single active session (BR-02)
  if (profile.role === 'STUDENT') {
    const existing = await refreshTokenStore.get(sKey)
    if (existing) {
      throw new ConflictError('Tài khoản sinh viên đang được đăng nhập trên một thiết bị khác.')
    }
  }

  await refreshTokenStore.set(sKey, refreshToken, REFRESH_TTL_SECONDS)
  logger.info('User logged in', { userId: profile.id, role: profile.role })

  return { accessToken, refreshToken, user: profile }
}

/**
 * Resolves available roles for a user from user.roles and attached profiles.
 */
function resolveAvailableRoles(user: UserWithProfiles): AvailableRoleDto[] {
  const roles = (user.roles as AccountRole[]) || []
  const available: AvailableRoleDto[] = []

  for (const role of roles) {
    if (role === 'STUDENT') {
      const student = user.students.find((s) => s.status === 'ACTIVE') ?? user.students[0]
      if (student) {
        available.push({
          role: 'STUDENT',
          name: ROLE_DISPLAY_NAMES.STUDENT,
          profileId: student.id,
          code: user.username ?? '',
        })
      }
    } else if (role === 'TEACHER') {
      const teacher = user.teachers.find((t) => t.status === 'ACTIVE') ?? user.teachers[0]
      if (teacher) {
        available.push({
          role: 'TEACHER',
          name: ROLE_DISPLAY_NAMES.TEACHER,
          profileId: teacher.id,
          code: user.username ?? '',
          position: teacher.position,
        })
      }
    } else if (role === 'DEPARTMENT_HEAD') {
      const teacher = user.teachers.find((t) => t.status === 'ACTIVE') ?? user.teachers[0]
      if (teacher) {
        available.push({
          role: 'DEPARTMENT_HEAD',
          name: ROLE_DISPLAY_NAMES.DEPARTMENT_HEAD,
          profileId: teacher.id,
          code: user.username ?? '',
          position: 'DEPARTMENT_HEAD',
        })
      }
    } else if (role === 'ADMIN') {
      const admin = user.admins.find((a) => a.role === 'ADMIN' && a.status === 'ACTIVE') ?? user.admins[0]
      if (admin) {
        available.push({
          role: 'ADMIN',
          name: ROLE_DISPLAY_NAMES.ADMIN,
          profileId: admin.id,
          code: user.username ?? '',
        })
      }
    } else if (role === 'EDUCATION_OFFICER') {
      const admin = user.admins.find((a) => a.role === 'EDUCATION_OFFICER' && a.status === 'ACTIVE') ?? user.admins[0]
      if (admin) {
        available.push({
          role: 'EDUCATION_OFFICER',
          name: ROLE_DISPLAY_NAMES.EDUCATION_OFFICER,
          profileId: admin.id,
          code: user.username ?? '',
        })
      }
    }
  }

  // Fallback: If roles array in DB was empty, infer from attached profiles
  if (available.length === 0) {
    if (user.students.length > 0 && user.students[0].status === 'ACTIVE') {
      available.push({
        role: 'STUDENT',
        name: ROLE_DISPLAY_NAMES.STUDENT,
        profileId: user.students[0].id,
        code: user.username ?? '',
      })
    }
    if (user.teachers.length > 0 && user.teachers[0].status === 'ACTIVE') {
      const t = user.teachers[0]
      if (t.position === 'DEPARTMENT_HEAD') {
        available.push({
          role: 'DEPARTMENT_HEAD',
          name: ROLE_DISPLAY_NAMES.DEPARTMENT_HEAD,
          profileId: t.id,
          code: user.username ?? '',
          position: 'DEPARTMENT_HEAD',
        })
      }
      available.push({
        role: 'TEACHER',
        name: ROLE_DISPLAY_NAMES.TEACHER,
        profileId: t.id,
        code: user.username ?? '',
        position: t.position,
      })
    }
    if (user.admins.length > 0 && user.admins[0].status === 'ACTIVE') {
      const a = user.admins[0]
      available.push({
        role: a.role as AccountRole,
        name: ROLE_DISPLAY_NAMES[a.role as AccountRole] ?? a.role,
        profileId: a.id,
        code: user.username ?? '',
      })
    }
  }

  return available
}

/**
 * Given a User and selected role, builds the UserProfileDto
 */
async function buildProfileForRole(user: UserWithProfiles, role: AccountRole): Promise<UserProfileDto> {
  const allRoles = user.roles as AccountRole[]

  if (role === 'STUDENT') {
    const student = user.students[0]
    if (!student) throw new NotFoundError('Hồ sơ sinh viên không tồn tại')
    return toStudentProfileDto({ ...student, user }, allRoles)
  }

  if (role === 'TEACHER' || role === 'DEPARTMENT_HEAD') {
    const teacher = user.teachers[0]
    if (!teacher) throw new NotFoundError('Hồ sơ giảng viên không tồn tại')
    return toTeacherProfileDto({ ...teacher, user }, role, allRoles)
  }

  // ADMIN | EDUCATION_OFFICER
  const admin = user.admins.find((a) => a.role === role) ?? user.admins[0]
  if (!admin) throw new NotFoundError('Hồ sơ quản trị không tồn tại')
  const rolePerms = await repo.findRolePermissions(admin.role)
  return toAdminProfileDto({ ...admin, user }, rolePerms, allRoles)
}

// ── Public service functions ──────────────────────────────────────────────────

/**
 * Single-account login.
 *
 * - Matches user by username only. The username is the user's account code.
 * - Verifies user password (stored once on User model).
 * - If user has 1 active role: issues tokens immediately and returns profile.
 * - If user has 2+ active roles: issues short-lived selectionToken in Redis and
 *   returns available roles for the client to display the role selection boxes.
 */
export async function login(dto: LoginRequestDto): Promise<LoginApiResponseDto> {
  const user = await repo.findUserByUsername(dto.username)

  if (!user) {
    logger.warn('Login failed: username not found', { username: dto.username })
    throw new UnauthorizedError('Tài khoản hoặc mật khẩu không chính xác')
  }

  const passwordOk = await bcrypt.compare(dto.password, user.password)
  if (!passwordOk) {
    logger.warn('Login failed: wrong password', { userId: user.id })
    throw new UnauthorizedError('Tài khoản hoặc mật khẩu không chính xác')
  }

  if (user.status !== 'ACTIVE') {
    logger.warn('Login failed: user inactive', { userId: user.id })
    throw new ForbiddenError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động')
  }

  const availableRoles = resolveAvailableRoles(user)
  if (availableRoles.length === 0) {
    logger.warn('Login failed: user has no active roles', { userId: user.id })
    throw new ForbiddenError('Tài khoản chưa được phân quyền truy cập')
  }

  // Exactly 1 role → complete login immediately
  if (availableRoles.length === 1) {
    const targetRole = availableRoles[0].role
    const profile = await buildProfileForRole(user, targetRole)
    return issueTokens(profile)
  }

  // 2+ roles → require role selection
  const selectionToken = crypto.randomUUID()
  const entry: SelectionEntry = {
    userId: user.id,
    roles: availableRoles.map((r) => r.role),
    source: 'LOGIN',
  }
  await redis.set(`${SELECTION_PREFIX}${selectionToken}`, JSON.stringify(entry), 'EX', SELECTION_TOKEN_TTL)

  logger.info('Role selection required', { userId: user.id, roles: entry.roles })

  const response: RoleSelectionRequiredDto = {
    requireRoleSelection: true,
    selectionToken,
    availableRoles,
    user: {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    },
  }
  return response
}

/**
 * Step 2 of login (only called when multiple roles exist).
 *
 * Validates selectionToken from Redis, confirms requested role, then issues full JWT tokens.
 */
export async function selectRole(dto: SelectRoleRequestDto): Promise<LoginResponseDto> {
  const raw = await redis.get(`${SELECTION_PREFIX}${dto.selectionToken}`)
  if (!raw) {
    throw new UnauthorizedError('Phiên chọn vai trò đã hết hạn. Vui lòng đăng nhập lại')
  }

  const entry: SelectionEntry = JSON.parse(raw)
  if (!entry.roles.includes(dto.role)) {
    throw new ForbiddenError('Vai trò yêu cầu không hợp lệ với tài khoản này')
  }

  // Consume the token (one-time use)
  await redis.del(`${SELECTION_PREFIX}${dto.selectionToken}`)

  const user = await repo.findUserWithProfilesById(entry.userId)
  if (!user) {
    throw new NotFoundError('Tài khoản người dùng không tồn tại')
  }

  if (user.status !== 'ACTIVE') {
    throw new ForbiddenError('Tài khoản của bạn đã bị khóa hoặc ngừng hoạt động')
  }

  // Xóa tất cả refresh token hiện có của user trên mọi role trước khi issue token mới.
  // Chỉ áp dụng cho luồng chuyển vai trò trong phiên (ROLE_SWITCH) —
  // KHÔNG xóa khi là login thông thường để giữ nguyên BR-02 single-device check cho STUDENT.
  if (entry.source === 'ROLE_SWITCH') {
    await Promise.all(
      entry.roles.map((role) => refreshTokenStore.delete(sessionKey(entry.userId, role)))
    )
  }

  const profile = await buildProfileForRole(user, dto.role)
  return issueTokens(profile)
}

export async function refreshAccessToken(token: string): Promise<string> {
  let payload: JwtPayload
  try {
    payload = verifyRefreshToken(token)
  } catch {
    throw new UnauthorizedError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ')
  }

  const sKey = sessionKey(payload.sub, payload.role)
  const storedToken = (await refreshTokenStore.get(sKey)) || (await refreshTokenStore.get(payload.sub))
  if (!storedToken || storedToken !== token) {
    throw new UnauthorizedError('Phiên đăng nhập đã hết hạn hoặc không hợp lệ')
  }

  const user = await repo.findUserWithProfilesById(payload.sub)
  if (!user || user.status !== 'ACTIVE') {
    throw new UnauthorizedError('Tài khoản không tồn tại hoặc đã bị khóa')
  }

  const freshPayload: JwtPayload = {
    sub: payload.sub,
    profileId: payload.profileId,
    role: payload.role,
  }

  return signAccessToken(freshPayload)
}

/**
 * Tạo selection token mới cho user đã đăng nhập — dùng để chuyển vai trò
 * trong phiên mà không cần nhập lại mật khẩu.
 * Chỉ hợp lệ khi user thực sự có ≥ 2 vai trò đang hoạt động.
 */
export async function requestRoleSwitch(userId: string): Promise<RoleSelectionRequiredDto> {
  const user = await repo.findUserWithProfilesById(userId)
  if (!user) throw new UnauthorizedError('Người dùng không tồn tại')
  if (user.status !== 'ACTIVE') throw new ForbiddenError('Tài khoản đã bị khóa')

  const availableRoles = resolveAvailableRoles(user)
  if (availableRoles.length < 2) {
    throw new ForbiddenError('Tài khoản chỉ có một vai trò, không cần chuyển')
  }

  const selectionToken = crypto.randomUUID()
  const entry: SelectionEntry = {
    userId: user.id,
    roles: availableRoles.map((r) => r.role),
    source: 'ROLE_SWITCH',
  }
  await redis.set(`${SELECTION_PREFIX}${selectionToken}`, JSON.stringify(entry), 'EX', SELECTION_TOKEN_TTL)

  logger.info('Role switch requested', { userId: user.id, roles: entry.roles })

  return {
    requireRoleSelection: true,
    selectionToken,
    availableRoles,
    user: {
      id: user.id,
      fullName: user.fullName,
      avatarUrl: user.avatarUrl,
    },
  }
}

export async function logout(accessToken: string, userId: string): Promise<void> {
  try {
    const decoded = verifyAccessToken(accessToken)
    await refreshTokenStore.delete(sessionKey(userId, decoded.role))
    const remainingTtl = decoded.exp - Math.floor(Date.now() / 1000)
    await tokenBlacklist.add(decoded.jti, remainingTtl)
  } catch {
    await refreshTokenStore.delete(userId)
  }

  logger.info('User logged out', { userId })
}

export async function getMe(userId: string, role: AccountRole): Promise<UserProfileDto> {
  const user = await repo.findUserWithProfilesById(userId)
  if (!user) throw new UnauthorizedError('Người dùng không tồn tại')
  return buildProfileForRole(user, role)
}

export async function updateMe(userId: string, role: AccountRole, input: UpdateMeInput): Promise<UserProfileDto> {
  const email = input.email?.trim() || null
  const phoneNumber = input.phoneNumber?.trim() || null

  if (email) {
    const existing = await repo.findUserByEmail(email)
    if (existing && existing.id !== userId) throw new ConflictError('Email đã tồn tại trong hệ thống')
  }

  await repo.updateUserContact(userId, { email, phoneNumber })
  return getMe(userId, role)
}

export async function changePassword(
  userId: string,
  _profileId: string,
  _role: AccountRole,
  input: ChangePasswordInput,
): Promise<void> {
  const user = await repo.findUserById(userId)
  if (!user) throw new UnauthorizedError('Người dùng không tồn tại')

  const passwordOk = await bcrypt.compare(input.currentPassword, user.password)
  if (!passwordOk) throw new UnauthorizedError('Mật khẩu hiện tại không chính xác')

  const hashed = await bcrypt.hash(input.newPassword, SALT_ROUNDS)
  await repo.updateUserPassword(userId, hashed)
}

