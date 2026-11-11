import type { Prisma, UserRole } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { CreateUserBody, EnrollmentQuery, UpdateUserBody, UsersQuery } from '../validators/admin-users.validator'

export const userSelect = {
  id: true, username: true, fullName: true, email: true, phoneNumber: true, avatarUrl: true,
  admins: { select: { id: true, adminCode: true, status: true, role: true }, take: 1 },
  teachers: {
    select: {
      id: true, teacherCode: true, status: true, position: true,
      department: { select: { id: true, code: true, name: true } },
    },
    take: 1,
  },
  students: { select: { id: true, studentCode: true, status: true,
    faceProfile: { select: { status: true, enrolledAt: true, revokedAt: true,
      referenceImageCapturedAt: true, providerFaceId: true } },
  }, take: 1 },
} satisfies Prisma.UserSelect

export function listUsers(query: UsersQuery) {
  const profileFilter = query.role === 'ADMIN' || query.role === 'EDUCATION_OFFICER'
    ? { admins: { some: { role: query.role, ...(query.status && { status: query.status }) } } }
    : query.role === 'TEACHER'
      ? { teachers: { some: { ...(query.status && { status: query.status }), ...(query.departmentId && { departmentId: query.departmentId }) } } }
      : query.role === 'STUDENT'
        ? { students: { some: { ...(query.status && { status: query.status }) } } }
        : {}

  const where: Prisma.UserWhereInput = {
    ...profileFilter,
    ...(query.status === 'ACTIVE' && { status: 'ACTIVE' }),
    ...(query.keyword && { OR: [
      { fullName: { contains: query.keyword, mode: 'insensitive' } },
      { email: { contains: query.keyword, mode: 'insensitive' } },
      { admins: { some: { adminCode: { contains: query.keyword, mode: 'insensitive' } } } },
      { teachers: { some: { teacherCode: { contains: query.keyword, mode: 'insensitive' } } } },
      { students: { some: { studentCode: { contains: query.keyword, mode: 'insensitive' } } } },
    ] }),
  }

  return Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where, select: userSelect,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { fullName: 'asc' },
    }),
  ])
}

export const findUserByEmail = (email: string) => prisma.user.findFirst({ where: { email } })
export const findUserByUsername = (username: string) => prisma.user.findUnique({ where: { username } })
export const findUserRoleSummary = (userId: string) => prisma.user.findUnique({
  where: { id: userId }, select: { roles: true, admins: { select: { role: true } } },
})
export const findAdminByCode = (code: string) => prisma.admin.findUnique({ where: { adminCode: code } })
export const findTeacherByCode = (code: string) => prisma.teacher.findUnique({ where: { teacherCode: code } })
export const findStudentByCode = (code: string) => prisma.student.findUnique({ where: { studentCode: code } })

export async function generateNextUserCode(tx?: Prisma.TransactionClient): Promise<string> {
  const db = tx || prisma
  const prefix = 'US'
  const digits = 6
  const users = await db.user.findMany({
    where: { username: { startsWith: prefix, mode: 'insensitive' } },
    select: { username: true },
  })
  const existingCodes = users.flatMap((item) => item.username ? [item.username] : [])

  let maxNum = 0
  const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`^${escapedPrefix}(\\d+)$`, 'i')

  for (const code of existingCodes) {
    const match = code.match(regex)
    if (match && match[1]) {
      const parsed = parseInt(match[1], 10)
      if (!isNaN(parsed) && parsed > maxNum) {
        maxNum = parsed
      }
    }
  }

  const nextNum = maxNum + 1
  return `${prefix}${String(nextNum).padStart(digits, '0')}`
}

export async function findProfile(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string) {
  if (role === 'ADMIN' || role === 'EDUCATION_OFFICER') {
    return prisma.admin.findFirst({ where: { id: profileId, role } })
  }
  if (role === 'TEACHER') return prisma.teacher.findUnique({ where: { id: profileId } })
  return prisma.student.findUnique({ where: { id: profileId } })
}

export async function updateStatus(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, status: 'ACTIVE' | 'INACTIVE') {
  const profile = await findProfile(role, profileId)
  if (!profile) return null
  return prisma.$transaction(async (tx) => {
    await tx.user.update({ where: { id: profile.userId }, data: { status } })
    await tx.admin.updateMany({ where: { userId: profile.userId }, data: { status } })
    await tx.teacher.updateMany({ where: { userId: profile.userId }, data: { status } })
    await tx.student.updateMany({ where: { userId: profile.userId }, data: { status } })
    return { userId: profile.userId, status }
  })
}

export async function updatePassword(role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, password: string) {
  const profile = await findProfile(role, profileId)
  if (!profile?.userId) return null
  return prisma.user.update({ where: { id: profile.userId }, data: { password } })
}

export function updateUser(
  role: 'ADMIN' | 'EDUCATION_OFFICER' | 'TEACHER' | 'STUDENT', profileId: string, userId: string, data: UpdateUserBody,
) {
  return prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        username: data.code,
        fullName: data.fullName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        status: data.status,
      },
    })
    await tx.admin.updateMany({ where: { userId }, data: { adminCode: data.code, status: data.status } })
    await tx.teacher.updateMany({ where: { userId }, data: { teacherCode: data.code, status: data.status } })
    await tx.student.updateMany({ where: { userId }, data: { studentCode: data.code, status: data.status } })
    if (role === 'TEACHER') {
      await tx.teacher.update({ where: { id: profileId }, data: { departmentId: data.departmentId! } })
    }
    return { id: userId, profileId, code: data.code, role }
  })
}

export function createUser(data: CreateUserBody, password: string) {
  return prisma.$transaction(async (tx) => {
    const roles = data.roles ?? [data.role]
    const user = await tx.user.create({
      data: {
        fullName: data.fullName,
        username: data.code,
        email: data.email,
        phoneNumber: data.phoneNumber,
        password,
        status: data.status,
        roles,
      },
    })
    const backofficeRole = roles.find((role) => role === 'ADMIN' || role === 'EDUCATION_OFFICER')
    if (backofficeRole) {
      await tx.admin.create({ data: { adminCode: data.code, role: backofficeRole, status: data.status, userId: user.id } })
    }
    if (roles.includes('TEACHER')) {
      await tx.teacher.create({
        data: { teacherCode: data.code, status: data.status, userId: user.id, departmentId: data.departmentId },
      })
    }
    if (roles.includes('STUDENT')) {
      await tx.student.create({ data: { studentCode: data.code, status: data.status, userId: user.id } })
    }
    return { id: user.id, code: data.code, roles }
  })
}

export function findUserForRoleChange(tx: Prisma.TransactionClient, userId: string) {
  return tx.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, status: true, roles: true,
      students: { select: { id: true } }, teachers: { select: { id: true, position: true } },
      admins: { select: { id: true, role: true } },
    },
  })
}

export async function attachRole(
  tx: Prisma.TransactionClient,
  userId: string,
  code: string,
  status: 'ACTIVE' | 'INACTIVE',
  roles: UserRole[],
  role: 'STUDENT' | 'TEACHER' | 'EDUCATION_OFFICER',
  departmentId?: string | null,
) {
  if (role === 'TEACHER') {
    await tx.teacher.create({ data: { userId, teacherCode: code, status, departmentId } })
  } else if (role === 'STUDENT') {
    await tx.student.create({ data: { userId, studentCode: code, status } })
  } else {
    await tx.admin.create({ data: { userId, adminCode: code, role, status } })
  }
  await tx.user.update({ where: { id: userId }, data: { roles: [...roles, role] } })
  return { userId, roles: [...roles, role] }
}

export async function enrollmentContext(
  tx: Prisma.TransactionClient,
  courseOfferingId: string,
  studentIds: string[],
) {
  const course = await tx.courseOffering.findUnique({
    where: { id: courseOfferingId },
    include: { semester: true, _count: { select: { enrollments: true } } },
  })
  if (!course) return { course: null, validStudents: 0, existing: 0, conflicting: null }

  const [validStudents, existing, conflicting] = await Promise.all([
    tx.student.count({ where: { id: { in: studentIds }, status: 'ACTIVE', user: { status: 'ACTIVE' } } }),
    tx.enrollment.count({ where: { courseOfferingId, studentId: { in: studentIds } } }),
    tx.enrollment.findFirst({
      where: {
        studentId: { in: studentIds },
        courseOfferingId: { not: courseOfferingId },
        subjectId: course.subjectId,
        semesterId: course.semesterId,
      },
      include: {
        student: { select: { studentCode: true } },
        courseOffering: { select: { code: true } },
      },
    }),
  ])
  return { course, validStudents, existing, conflicting }
}

export const findEnrollmentScope = (courseOfferingId: string) => prisma.courseOffering.findUnique({
  where: { id: courseOfferingId }, select: { subjectId: true, semesterId: true },
})

export function listEligibleStudents(subjectId: string, semesterId: string, query: EnrollmentQuery) {
  const where: Prisma.StudentWhereInput = {
    status: 'ACTIVE', user: { status: 'ACTIVE' },
    enrollments: { none: { subjectId, semesterId } },
    ...(query.keyword && { OR: [
      { studentCode: { contains: query.keyword, mode: 'insensitive' } },
      { user: { fullName: { contains: query.keyword, mode: 'insensitive' } } },
      { user: { email: { contains: query.keyword, mode: 'insensitive' } } },
    ] }),
  }
  return Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({ where, select: {
      id: true, studentCode: true, user: { select: { fullName: true, email: true } },
    }, skip: (query.page - 1) * query.pageSize, take: query.pageSize, orderBy: { studentCode: 'asc' } }),
  ])
}

export const createEnrollments = (
  tx: Prisma.TransactionClient,
  course: { id: string; subjectId: string; semesterId: string },
  studentIds: string[],
) => tx.enrollment.createMany({
  data: studentIds.map((studentId) => ({
    courseOfferingId: course.id,
    studentId,
    subjectId: course.subjectId,
    semesterId: course.semesterId,
  })),
  skipDuplicates: true,
})

export async function listStudentUserIds(studentIds: string[]) {
  const rows = await prisma.student.findMany({
    where: { id: { in: studentIds } },
    select: { userId: true },
  })
  return rows.map((row) => row.userId)
}

export function listCourseEnrollments(courseOfferingId: string, query: EnrollmentQuery) {
  const where: Prisma.EnrollmentWhereInput = {
    courseOfferingId,
    ...(query.keyword && {
      student: {
        OR: [
          { studentCode: { contains: query.keyword, mode: 'insensitive' } },
          { user: { fullName: { contains: query.keyword, mode: 'insensitive' } } },
          { user: { email: { contains: query.keyword, mode: 'insensitive' } } },
        ],
      },
    }),
  }
  return Promise.all([
    prisma.enrollment.count({ where }),
    prisma.enrollment.findMany({
      where,
      include: { student: { include: { user: true } } },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      orderBy: [{ student: { studentCode: 'asc' } }],
    }),
  ])
}

export const countStudentAttemptsInCourse = (courseOfferingId: string, studentId: string) =>
  prisma.examAttempt.count({ where: { courseOfferingId, studentId } })

export const withdrawEnrollment = (courseOfferingId: string, studentId: string) => prisma.enrollment.deleteMany({
  where: { courseOfferingId, studentId },
})
