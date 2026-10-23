import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import type { DepartmentBody, DepartmentQuery } from '../validators/academic.validator'

export const departmentInclude = {
  teachers: {
    where: { position: 'DEPARTMENT_HEAD' as const },
    select: { id: true, teacherCode: true, user: { select: { fullName: true } } },
  },
  _count: { select: { subjects: true, teachers: true } },
}

export function listDepartments(query: DepartmentQuery) {
  const where = {
    ...(query.status && { status: query.status }),
    ...(query.keyword && { OR: [
      { code: { contains: query.keyword, mode: 'insensitive' as const } },
      { name: { contains: query.keyword, mode: 'insensitive' as const } },
    ] }),
  }
  return Promise.all([
    prisma.department.count({ where }),
    prisma.department.findMany({
      where, include: departmentInclude,
      skip: (query.page - 1) * query.pageSize, take: query.pageSize,
      orderBy: { name: 'asc' },
    }),
  ])
}

export const findDepartment = (id: string) => prisma.department.findUnique({ where: { id } })
export const findDepartmentByCode = (code: string) => prisma.department.findUnique({ where: { code } })
export const createDepartment = (data: DepartmentBody) => prisma.department.create({ data, include: departmentInclude })
export const updateDepartment = (id: string, data: DepartmentBody) => prisma.department.update({ where: { id }, data, include: departmentInclude })
export const findTeacherForHeadAssignment = (tx: Prisma.TransactionClient, teacherId: string) => tx.teacher.findUnique({
  where: { id: teacherId }, select: { id: true, status: true, departmentId: true },
})

export async function assignDepartmentHead(
  tx: Prisma.TransactionClient,
  departmentId: string,
  teacherId: string | null,
) {
  const oldHeads = await tx.teacher.findMany({
    where: { departmentId, position: 'DEPARTMENT_HEAD' },
    select: { id: true, userId: true },
  })
  for (const oldHead of oldHeads) {
    const user = await tx.user.findUnique({ where: { id: oldHead.userId }, select: { roles: true } })
    if (user) {
      const updatedRoles = user.roles.filter((r) => r !== 'DEPARTMENT_HEAD')
      if (!updatedRoles.includes('TEACHER')) updatedRoles.push('TEACHER')
      await tx.user.update({ where: { id: oldHead.userId }, data: { roles: updatedRoles } })
    }
  }

  await tx.teacher.updateMany({
    where: { departmentId, position: 'DEPARTMENT_HEAD' },
    data: { position: 'LECTURER' },
  })
  if (!teacherId) return null

  const updatedTeacher = await tx.teacher.update({
    where: { id: teacherId },
    data: { position: 'DEPARTMENT_HEAD' },
    select: { id: true, teacherCode: true, userId: true, user: { select: { fullName: true, roles: true } } },
  })

  if (updatedTeacher.user && !updatedTeacher.user.roles.includes('DEPARTMENT_HEAD')) {
    await tx.user.update({
      where: { id: updatedTeacher.userId },
      data: { roles: [...updatedTeacher.user.roles, 'DEPARTMENT_HEAD'] },
    })
  }

  return { id: updatedTeacher.id, teacherCode: updatedTeacher.teacherCode, user: { fullName: updatedTeacher.user.fullName } }
}
