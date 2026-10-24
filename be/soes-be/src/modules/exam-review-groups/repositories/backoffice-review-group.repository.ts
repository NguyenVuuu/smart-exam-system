import prisma from '../../../lib/prisma'

const groupView = {
  id: true, name: true, status: true, createdAt: true, updatedAt: true,
  department: { select: { id: true, code: true, name: true, status: true } },
  members: {
    where: { status: 'ACTIVE' as const },
    select: {
      teacherId: true, joinedAt: true,
      teacher: { select: { teacherCode: true, status: true, user: { select: { fullName: true, status: true } } } },
    },
    orderBy: { joinedAt: 'asc' as const },
  },
}

export function listGroups() {
  return prisma.departmentReviewGroup.findMany({
    select: groupView,
    orderBy: [{ department: { code: 'asc' } }],
  })
}

export function findGroup(id: string) {
  return prisma.departmentReviewGroup.findUnique({ where: { id }, select: groupView })
}
