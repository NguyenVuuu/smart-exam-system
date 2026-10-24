import type { Prisma } from '@prisma/client'

export async function findActor(tx: Prisma.TransactionClient, teacherId: string) {
  return tx.teacher.findUnique({
    where: { id: teacherId },
    select: {
      id: true,
      departmentId: true,
      position: true,
      status: true,
      userId: true,
      user: { select: { status: true } },
      department: { select: { status: true } },
    },
  })
}

export function findGroup(tx: Prisma.TransactionClient, departmentId: string) {
  return tx.departmentReviewGroup.findUnique({
    where: { departmentId },
    include: {
      department: { select: { id: true, code: true, name: true } },
      members: {
        where: { status: 'ACTIVE' },
        select: {
          teacherId: true,
          joinedAt: true,
          teacher: { select: { teacherCode: true, status: true, user: { select: { fullName: true, status: true } } } },
        },
        orderBy: { joinedAt: 'asc' },
      },
    },
  })
}

export function hasOpenRounds(tx: Prisma.TransactionClient, groupId: string) {
  return tx.examReviewRound.count({
    where: { groupId, status: { in: ['WAITING_FOR_REVIEWERS', 'PENDING'] } },
  })
}
