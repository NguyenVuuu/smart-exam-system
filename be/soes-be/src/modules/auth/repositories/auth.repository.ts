import { User } from '@prisma/client'
import prisma from '../../../lib/prisma'

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findFirst({
    where: { email },
  })
}

export async function findUserByStudentCode(studentCode: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { studentCode },
  })
}

export async function findUserByTeacherCode(teacherCode: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { teacherCode },
  })
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  })
}
