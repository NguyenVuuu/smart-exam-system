import { Admin, BackofficeRole, Student, Teacher, User } from '@prisma/client'
import prisma from '../../../lib/prisma'

export type StudentWithUser = Student & { user: User }
export type TeacherWithUser = Teacher & {
  user: User
  department?: { id: string; code: string; name: string } | null
}
export type AdminWithUser = Admin & {
  user: User
  permissionOverrides: Array<{ permission: string; allowed: boolean }>
}

export type UserWithProfiles = User & {
  students: Student[]
  teachers: Array<Teacher & { department?: { id: string; code: string; name: string } | null }>
  admins: Array<Admin & { permissionOverrides: Array<{ permission: string; allowed: boolean }> }>
}

export const findRolePermissions = (role: BackofficeRole) =>
  prisma.backofficeRolePermission.findMany({
    where: { role },
    select: { permission: true },
  })

// ── Login lookup ──
// The account code is stored as User.username and is the only login credential.
// Email and profile codes are never accepted as login aliases.

export async function findUserByUsername(username: string): Promise<UserWithProfiles | null> {
  const trimmed = username.trim()
  return prisma.user.findFirst({
    where: {
      username: { equals: trimmed, mode: 'insensitive' },
    },
    include: {
      students: true,
      teachers: { include: { department: { select: { id: true, code: true, name: true } } } },
      admins: { include: { permissionOverrides: true } },
    },
  })
}

export async function findUserWithProfilesById(userId: string): Promise<UserWithProfiles | null> {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      students: true,
      teachers: { include: { department: { select: { id: true, code: true, name: true } } } },
      admins: { include: { permissionOverrides: true } },
    },
  })
}

// ── Lookup by profile code ──────────────────────────────────────────────────

export async function findStudentByCode(studentCode: string): Promise<StudentWithUser | null> {
  return prisma.student.findUnique({
    where: { studentCode },
    include: { user: true },
  })
}

export async function findTeacherByCode(teacherCode: string): Promise<TeacherWithUser | null> {
  return prisma.teacher.findUnique({
    where: { teacherCode },
    include: { user: true, department: { select: { id: true, code: true, name: true } } },
  })
}

export async function findAdminByCode(adminCode: string): Promise<AdminWithUser | null> {
  return prisma.admin.findUnique({
    where: { adminCode },
    include: { user: true, permissionOverrides: true },
  })
}

// ── Lookup by userId ────────────────────────────────────────────────────────

export async function findStudentByUserId(userId: string): Promise<StudentWithUser | null> {
  return prisma.student.findFirst({
    where: { userId },
    include: { user: true },
  })
}

export async function findTeacherByUserId(userId: string): Promise<TeacherWithUser | null> {
  return prisma.teacher.findFirst({
    where: { userId },
    include: { user: true, department: { select: { id: true, code: true, name: true } } },
  })
}

export async function findAdminByUserId(userId: string): Promise<AdminWithUser | null> {
  return prisma.admin.findFirst({
    where: { userId },
    include: { user: true, permissionOverrides: true },
  })
}

// ── Find by profileId ───────────────────────────────────────────────────────

export async function findStudentById(studentId: string): Promise<StudentWithUser | null> {
  return prisma.student.findUnique({
    where: { id: studentId },
    include: { user: true },
  })
}

export async function findTeacherById(teacherId: string): Promise<TeacherWithUser | null> {
  return prisma.teacher.findUnique({
    where: { id: teacherId },
    include: { user: true, department: { select: { id: true, code: true, name: true } } },
  })
}

export async function findAdminById(adminId: string): Promise<AdminWithUser | null> {
  return prisma.admin.findUnique({
    where: { id: adminId },
    include: { user: true, permissionOverrides: true },
  })
}

// ── User management & contact ───────────────────────────────────────────────

export async function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id: userId } })
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findFirst({ where: { email } })
}

export async function updateUserContact(
  userId: string,
  data: { email?: string | null; phoneNumber?: string | null },
): Promise<User> {
  return prisma.user.update({ where: { id: userId }, data })
}

export async function updateUserPassword(userId: string, password: string): Promise<User> {
  return prisma.user.update({
    where: { id: userId },
    data: { password },
  })
}

