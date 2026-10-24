import { Prisma } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../errors/AppError'
import { runSerializable } from '../../../utils/transaction'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import * as repo from '../repositories/review-group.repository'

async function manager(tx: Prisma.TransactionClient, adminId: string, userId: string) {
  const admin = await tx.admin.findUnique({
    where: { id: adminId }, select: { userId: true, role: true, status: true, user: { select: { status: true } } },
  })
  if (!admin || admin.userId !== userId || admin.role !== 'ADMIN' || admin.status !== 'ACTIVE' || admin.user.status !== 'ACTIVE') {
    throw new ForbiddenError('Admin support permission required')
  }
}

async function groupForUpdate(tx: Prisma.TransactionClient, id: string) {
  const group = await tx.departmentReviewGroup.findUnique({ where: { id }, select: { departmentId: true } })
  if (!group) throw new NotFoundError('Review group not found')
  return (await repo.findGroup(tx, group.departmentId))!
}

async function audit(tx: Prisma.TransactionClient, userId: string, groupId: string, action: string, reason: string, before: unknown, after: unknown) {
  await writeAuditLog(tx, {
    userId, action, entityType: 'DepartmentReviewGroup', entityId: groupId,
    metadata: { reason, before, after } as Prisma.InputJsonValue,
  })
}

export async function create(adminId: string, userId: string, departmentId: string, name: string, reason: string) {
  try {
    return await runSerializable(async (tx) => {
    await manager(tx, adminId, userId)
    const department = await tx.department.findUnique({ where: { id: departmentId }, select: { status: true } })
    if (!department || department.status !== 'ACTIVE') throw new NotFoundError('Active department not found')
    if (await repo.findGroup(tx, departmentId)) throw new ConflictError('Department already has a review group')
    const head = await tx.teacher.findFirst({
      where: { departmentId, position: 'DEPARTMENT_HEAD', status: 'ACTIVE', user: { status: 'ACTIVE' } },
      select: { id: true },
    })
    if (!head) throw new ConflictError('Department needs an active head before creating a review group')
    const group = await tx.departmentReviewGroup.create({
      data: { departmentId, name, createdById: head.id, members: { create: { teacherId: head.id } } },
    })
    await audit(tx, userId, group.id, 'REVIEW_GROUP_SUPPORT_CREATED', reason, null, { departmentId, name, headId: head.id })
    return repo.findGroup(tx, departmentId)
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Department already has a review group')
    }
    throw error
  }
}

export function rename(adminId: string, userId: string, id: string, name: string, reason: string) {
  return runSerializable(async (tx) => {
    await manager(tx, adminId, userId)
    const group = await groupForUpdate(tx, id)
    if (group.name !== name) {
      await tx.departmentReviewGroup.update({ where: { id }, data: { name } })
      await audit(tx, userId, id, 'REVIEW_GROUP_SUPPORT_RENAMED', reason, { name: group.name }, { name })
    }
    return repo.findGroup(tx, group.departmentId)
  })
}

export function setStatus(adminId: string, userId: string, id: string, status: 'ACTIVE' | 'INACTIVE', reason: string) {
  return runSerializable(async (tx) => {
    await manager(tx, adminId, userId)
    const group = await groupForUpdate(tx, id)
    if (status === 'INACTIVE') {
      const [openRounds, pendingQuestions] = await Promise.all([
        repo.hasOpenRounds(tx, id),
        tx.questionBankItem.count({ where: { status: 'PENDING', removedAt: null, question: { subject: { departmentId: group.departmentId } } } }),
      ])
      if (openRounds || pendingQuestions) throw new ConflictError('Resolve pending exams and questions before deactivating the group')
    }
    if (group.status !== status) {
      await tx.departmentReviewGroup.update({ where: { id }, data: { status } })
      await audit(tx, userId, id, 'REVIEW_GROUP_SUPPORT_STATUS_CHANGED', reason, { status: group.status }, { status })
    }
    return repo.findGroup(tx, group.departmentId)
  })
}

export function candidates(adminId: string, userId: string, id: string) {
  return runSerializable(async (tx) => {
    await manager(tx, adminId, userId)
    const group = await groupForUpdate(tx, id)
    return repo.listCandidates(tx, group.departmentId)
  })
}

export function addMember(adminId: string, userId: string, id: string, teacherId: string, reason: string) {
  return runSerializable(async (tx) => {
    await manager(tx, adminId, userId)
    const group = await groupForUpdate(tx, id)
    const teacher = await repo.findCandidate(tx, teacherId)
    if (!teacher || teacher.departmentId !== group.departmentId || teacher.status !== 'ACTIVE' || teacher.user.status !== 'ACTIVE') {
      throw new ForbiddenError('Active teacher in the same department required')
    }
    const previous = await tx.departmentReviewMember.findUnique({ where: { groupId_teacherId: { groupId: id, teacherId } } })
    if (previous?.status === 'ACTIVE') throw new ConflictError('Teacher is already a member')
    if (previous) {
      await tx.departmentReviewMember.update({ where: { id: previous.id }, data: { status: 'ACTIVE', joinedAt: new Date(), leftAt: null } })
    } else {
      await tx.departmentReviewMember.create({ data: { groupId: id, teacherId } })
    }
    await repo.refreshOpenRounds(tx, id, group.departmentId)
    await audit(tx, userId, id, 'REVIEW_GROUP_SUPPORT_MEMBER_ADDED', reason, { teacherId, status: previous?.status ?? null }, { teacherId, status: 'ACTIVE' })
    return repo.findGroup(tx, group.departmentId)
  })
}

export function removeMember(adminId: string, userId: string, id: string, teacherId: string, reason: string) {
  return runSerializable(async (tx) => {
    await manager(tx, adminId, userId)
    const group = await groupForUpdate(tx, id)
    const teacher = await repo.findCandidate(tx, teacherId)
    if (teacher?.departmentId === group.departmentId && teacher.position === 'DEPARTMENT_HEAD' && teacher.status === 'ACTIVE') {
      throw new ForbiddenError('Current department head must remain a member')
    }
    const member = await tx.departmentReviewMember.findUnique({ where: { groupId_teacherId: { groupId: id, teacherId } } })
    if (!member || member.status !== 'ACTIVE') throw new NotFoundError('Active group member not found')
    await tx.departmentReviewMember.update({ where: { id: member.id }, data: { status: 'INACTIVE', leftAt: new Date() } })
    await repo.refreshOpenRounds(tx, id, group.departmentId)
    await audit(tx, userId, id, 'REVIEW_GROUP_SUPPORT_MEMBER_REMOVED', reason, { teacherId, status: 'ACTIVE' }, { teacherId, status: 'INACTIVE' })
    return repo.findGroup(tx, group.departmentId)
  })
}
