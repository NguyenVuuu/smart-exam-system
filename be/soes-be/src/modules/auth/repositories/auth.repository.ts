import { Admin, Student, Teacher, User } from '@prisma/client'
import prisma from '../../../lib/prisma'

export type StudentWithUser = Student & { user: User }
export type TeacherWithUser = Teacher & { user: User }
export type AdminWithUser = Admin & { user: User }

export async function findStudentByCode(studentCode: string): Promise<StudentWithUser | null> {
  return prisma.student.findUnique({
    where: { studentCode },
    include: { user: true },
  })
}

export async function findTeacherByCode(teacherCode: string): Promise<TeacherWithUser | null> {
  return prisma.teacher.findUnique({
    where: { teacherCode },
    include: { user: true },
  })
}

export async function findAdminByCode(adminCode: string): Promise<AdminWithUser | null> {
  return prisma.admin.findUnique({
    where: { adminCode },
    include: { user: true },
  })
}

export async function findUserById(userId: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id: userId },
  })
}

export async function findStudentByUserId(userId: string): Promise<StudentWithUser | null> {
  return prisma.student.findUnique({
    where: { userId },
    include: { user: true },
  })
}

export async function findTeacherByUserId(userId: string): Promise<TeacherWithUser | null> {
  return prisma.teacher.findUnique({
    where: { userId },
    include: { user: true },
  })
}

export async function findAdminByUserId(userId: string): Promise<AdminWithUser | null> {
  return prisma.admin.findUnique({
    where: { userId },
    include: { user: true },
  })
}
