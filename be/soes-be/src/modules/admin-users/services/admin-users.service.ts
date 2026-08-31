import bcrypt from 'bcrypt'
import { ConflictError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { runSerializable } from '../../../utils/transaction'
import * as repo from '../repositories/admin-users.repository'
import type { CreateUserBody, EnrollmentQuery, UpdateUserBody, UsersQuery } from '../validators/admin-users.validator'
import { toAdminUserDto } from '../mappers/admin-user.mapper'

const saltRounds = 12

export async function list(query: UsersQuery) {
  const [total, rows] = await repo.listUsers(query)
  const items = rows.map(toAdminUserDto)
  return { items, pagination: toPagination(query.page, query.pageSize, total) }
}

export async function create(data: CreateUserBody) {
  if (data.email && await repo.findUserByEmail(data.email)) throw new ConflictError('Email already exists')
  const duplicate = data.role === 'ADMIN'
    ? await repo.findAdminByCode(data.code)
    : data.role === 'TEACHER'
      ? await repo.findTeacherByCode(data.code)
      : await repo.findStudentByCode(data.code)
  if (duplicate) throw new ConflictError('Account code already exists')
  if (data.role === 'TEACHER' && !data.departmentId) throw new ValidationError('Teacher department is required')

  const password = await bcrypt.hash(data.password, saltRounds)
  return repo.createUser(data, password)
}

export async function update(role: 'ADMIN' | 'TEACHER' | 'STUDENT', profileId: string, data: UpdateUserBody) {
  const profile = await repo.findProfile(role, profileId)
  if (!profile) throw new NotFoundError('Account not found')
  const emailOwner = data.email ? await repo.findUserByEmail(data.email) : null
  if (emailOwner && emailOwner.id !== profile.userId) throw new ConflictError('Email already exists')
  const codeOwner = role === 'ADMIN'
    ? await repo.findAdminByCode(data.code)
    : role === 'TEACHER'
      ? await repo.findTeacherByCode(data.code)
      : await repo.findStudentByCode(data.code)
  if (codeOwner && codeOwner.id !== profileId) throw new ConflictError('Account code already exists')
  if (role === 'TEACHER' && !data.departmentId) throw new ValidationError('Teacher department is required')
  return repo.updateUser(role, profileId, profile.userId, data)
}

async function requireProfile(role: 'ADMIN' | 'TEACHER' | 'STUDENT', profileId: string) {
  if (!await repo.findProfile(role, profileId)) throw new NotFoundError('Account not found')
}

export async function setStatus(role: 'ADMIN' | 'TEACHER' | 'STUDENT', profileId: string, status: 'ACTIVE' | 'INACTIVE') {
  await requireProfile(role, profileId)
  return repo.updateStatus(role, profileId, status)
}

export async function resetPassword(role: 'ADMIN' | 'TEACHER' | 'STUDENT', profileId: string, rawPassword: string) {
  await requireProfile(role, profileId)
  return repo.updatePassword(role, profileId, await bcrypt.hash(rawPassword, saltRounds))
}

export async function enroll(courseOfferingId: string, studentIds: string[]) {
  return runSerializable(async (tx) => {
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
    return { created: result.count }
  })
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

export async function withdraw(courseOfferingId: string, studentId: string) {
  if (await repo.countStudentAttemptsInCourse(courseOfferingId, studentId)) {
    throw new ConflictError('Student cannot be removed after starting an exam in this course')
  }
  if (!(await repo.withdrawEnrollment(courseOfferingId, studentId)).count) throw new NotFoundError('Enrollment not found')
  return { removed: true }
}
