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

export function findCandidate(tx: Prisma.TransactionClient, teacherId: string) {
  return tx.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, departmentId: true, position: true, status: true, user: { select: { status: true } } },
  })
}

export function listCandidates(tx: Prisma.TransactionClient, departmentId: string) {
  return tx.teacher.findMany({
    where: { departmentId, status: 'ACTIVE', user: { status: 'ACTIVE' } },
    select: { id: true, teacherCode: true, position: true, user: { select: { fullName: true } } },
    orderBy: { teacherCode: 'asc' },
  })
}

export async function refreshOpenRounds(tx: Prisma.TransactionClient, groupId: string, departmentId: string) {
  const [rounds, members] = await Promise.all([
    tx.examReviewRound.findMany({
      where: { groupId, status: { in: ['WAITING_FOR_REVIEWERS', 'PENDING'] } },
      select: { id: true, submittedById: true, status: true },
    }),
    tx.departmentReviewMember.findMany({
      where: { groupId, status: 'ACTIVE', teacher: { departmentId, status: 'ACTIVE', user: { status: 'ACTIVE' } } },
      select: { teacherId: true },
    }),
  ])
  for (const round of rounds) {
    const eligible = members.some((member) => member.teacherId !== round.submittedById)
    const nextStatus = eligible ? 'PENDING' : 'WAITING_FOR_REVIEWERS'
    if (nextStatus !== round.status) {
      await tx.examReviewRound.updateMany({ where: { id: round.id, status: round.status }, data: { status: nextStatus } })
    }
  }
}
