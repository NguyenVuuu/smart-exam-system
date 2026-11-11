import bcrypt from 'bcrypt'
import type { UserRole } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { runSerializable } from '../../../utils/transaction'
import * as repo from '../repositories/admin-users.repository'
import type { AddUserRoleBody, CreateUserBody, EnrollmentQuery, UpdateUserBody, UsersQuery } from '../validators/admin-users.validator'
import { toAdminUserDto } from '../mappers/admin-user.mapper'
import { notifyUsers } from '../../notifications/notifications.service'

const saltRounds = 12

async function codeBelongsToAnotherProfile(code: string, existing?: { role: CreateUserBody['role']; profileId: string; userId?: string }) {
  const usernameOwner = await repo.findUserByUsername(code)
  if (usernameOwner) {
    if (!existing) return true
    if (existing.userId !== usernameOwner.id) return true
  }

  const [admin, teacher, student] = await Promise.all([
    repo.findAdminByCode(code),
    repo.findTeacherByCode(code),
    repo.findStudentByCode(code),
  ])
  return Boolean(
    (admin && (!existing || admin.userId !== existing.userId)) ||
    (teacher && (!existing || teacher.userId !== existing.userId)) ||
    (student && (!existing || student.userId !== existing.userId)),
  )
}

export async function list(query: UsersQuery) {
  const [total, rows] = await repo.listUsers(query)
  const items = rows.map((row) => toAdminUserDto(row, query.role))
  return { items, pagination: toPagination(query.page, query.pageSize, total) }
}

export async function getNextCode() {
  const code = await repo.generateNextUserCode()
  return { code }
}

export async function create(data: CreateUserBody) {
  if (data.email && await repo.findUserByEmail(data.email)) throw new ConflictError('Email already exists')
  
  let userCode = data.code?.trim() ? data.code.trim().toUpperCase() : ''
  if (!userCode) {
    userCode = await repo.generateNextUserCode()
  }

  if (await codeBelongsToAnotherProfile(userCode)) throw new ConflictError('Account code already exists')
  if ((data.roles ?? [data.role]).includes('TEACHER') && !data.departmentId) {
    throw new ValidationError('Teacher department is required')
  }

  const password = await bcrypt.hash(data.password, saltRounds)
  return repo.createUser({ ...data, code: userCode }, password)
}

async function requireAdminForAccount(userId: string, actorRole: string) {
  if (actorRole === 'ADMIN') return
  const account = await repo.findUserRoleSummary(userId)
  if (account?.roles.includes('ADMIN') || account?.admins.some((admin) => admin.role === 'ADMIN')) {
    throw new ForbiddenError('Only administrators can manage administrator accounts')
  }
}

export async function addRole(userId: string, data: AddUserRoleBody, actorRole: string) {
  return runSerializable(async (tx) => {
    const user = await repo.findUserForRoleChange(tx, userId)
    if (!user?.username) throw new NotFoundError('Account not found')
    if (actorRole !== 'ADMIN' && (user.roles.includes('ADMIN') || user.admins.some((admin) => admin.role === 'ADMIN'))) {
      throw new ForbiddenError('Only administrators can manage administrator accounts')
    }
    if (user.roles.includes('ADMIN') || user.admins.some((admin) => admin.role === 'ADMIN')) {
      throw new ValidationError('Vai trò Quản trị viên không kết hợp với vai trò khác')
    }
    if ((data.role === 'STUDENT' && user.students.length) || (data.role === 'TEACHER' && user.teachers.length) ||
      (data.role === 'EDUCATION_OFFICER' && user.admins.length)) {
      throw new ConflictError('Tài khoản đã có vai trò này')
    }
    if (data.role === 'TEACHER' && !data.departmentId) {
      throw new ValidationError('Teacher department is required')
    }
    if (await codeBelongsToAnotherProfile(user.username, { role: data.role, profileId: '', userId })) {
      throw new ConflictError('Account code already exists')
    }
    const roles: UserRole[] = [
      ...(user.students.length ? ['STUDENT' as const] : []),
      ...(user.teachers.length ? [user.teachers[0].position === 'DEPARTMENT_HEAD' ? 'DEPARTMENT_HEAD' as const : 'TEACHER' as const] : []),
      ...(user.admins.length ? [user.admins[0].role] : []),
    ]
    if (roles.length >= 3) throw new ConflictError('Tài khoản đã có đủ ba vai trò')
    return repo.attachRole(tx, userId, user.username, user.status, roles, data.role, data.departmentId)
  })
}

export async function update(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, data: UpdateUserBody, actorRole: string) {
  const profile = await repo.findProfile(role, profileId)
  if (!profile) throw new NotFoundError('Account not found')
  await requireAdminForAccount(profile.userId, actorRole)
  const emailOwner = data.email ? await repo.findUserByEmail(data.email) : null
  if (emailOwner && emailOwner.id !== profile.userId) throw new ConflictError('Email already exists')
  if (await codeBelongsToAnotherProfile(data.code, { role, profileId, userId: profile.userId })) throw new ConflictError('Account code already exists')
  if (role === 'TEACHER' && !data.departmentId) throw new ValidationError('Teacher department is required')
  return repo.updateUser(role, profileId, profile.userId, data)
}

async function requireProfile(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, actorRole: string) {
  const profile = await repo.findProfile(role, profileId)
  if (!profile) throw new NotFoundError('Account not found')
  await requireAdminForAccount(profile.userId, actorRole)
}

export async function setStatus(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, status: 'ACTIVE' | 'INACTIVE', actorRole: string) {
  await requireProfile(role, profileId, actorRole)
  return repo.updateStatus(role, profileId, status)
}

export async function resetPassword(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, rawPassword: string, actorRole: string) {
  await requireProfile(role, profileId, actorRole)
  return repo.updatePassword(role, profileId, await bcrypt.hash(rawPassword, saltRounds))
}

export async function enroll(courseOfferingId: string, studentIds: string[]) {
  const { created, courseCode, userIds } = await runSerializable(async (tx) => {
    const uniqueIds = [...new Set(studentIds)]
    const { course, validStudents, existing, conflicting } = await repo.enrollmentContext(tx, courseOfferingId, uniqueIds)
    if (!course) throw new NotFoundError('Course offering not found')
    if (course.status !== 'ACTIVE' || course.semester.status !== 'ACTIVE') {
      throw new ConflictError('Enrollment is only allowed for an active course in the current semester')
    }
    if (validStudents !== uniqueIds.length) throw new ValidationError('One or more students are invalid or inactive')
    if (conflicting) {
      throw new ConflictError(
        `Student ${conflicting.student.studentCode} is already enrolled in ${conflicting.courseOffering.code} for this subject and semester`,
      )
    }
    if (course._count.enrollments + uniqueIds.length - existing > course.maxCapacity) throw new ConflictError('Course offering capacity exceeded')
    const result = await repo.createEnrollments(tx, course, uniqueIds)
    const userIds = result.count > 0 ? await repo.listStudentUserIds(uniqueIds) : []
    return { created: result.count, courseCode: course.code, userIds }
  })
  if (created > 0) {
    await notifyUsers(userIds, 'Bạn được thêm vào lớp học phần', `Bạn vừa được thêm vào lớp ${courseCode}.`)
  }
  return { created }
}

export async function listEnrollments(courseOfferingId: string, query: EnrollmentQuery) {
  const [total, rows] = await repo.listCourseEnrollments(courseOfferingId, query)
  return {
    items: rows.map(({ student, enrolledAt }) => ({
      id: student.id,
      code: student.studentCode,
      fullName: student.user.fullName,
      email: student.user.email,
      enrolledAt,
    })),
    pagination: toPagination(query.page, query.pageSize, total),
  }
}

export async function listEligibleStudents(courseOfferingId: string, query: EnrollmentQuery) {
  const course = await repo.findEnrollmentScope(courseOfferingId)
  if (!course) throw new NotFoundError('Course offering not found')
  const [total, rows] = await repo.listEligibleStudents(course.subjectId, course.semesterId, query)
  return {
    items: rows.map(({ id, studentCode, user }) => ({
      id, code: studentCode, fullName: user.fullName, email: user.email,
    })),
    pagination: toPagination(query.page, query.pageSize, total),
  }
}

export async function withdraw(courseOfferingId: string, studentId: string) {
  if (await repo.countStudentAttemptsInCourse(courseOfferingId, studentId)) {
    throw new ConflictError('Student cannot be removed after starting an exam in this course')
  }
  if (!(await repo.withdrawEnrollment(courseOfferingId, studentId)).count) throw new NotFoundError('Enrollment not found')
  return { removed: true }
}
