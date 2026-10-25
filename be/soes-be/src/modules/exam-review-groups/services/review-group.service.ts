import { Prisma } from '@prisma/client'
import { ConflictError, ForbiddenError, NotFoundError } from '../../../errors/AppError'
import { runSerializable } from '../../../utils/transaction'
import * as repo from '../repositories/review-group.repository'

async function activeActor(tx: Prisma.TransactionClient, teacherId: string) {
  const actor = await repo.findActor(tx, teacherId)
  if (!actor || actor.status !== 'ACTIVE' || actor.user.status !== 'ACTIVE' || !actor.departmentId || actor.department?.status !== 'ACTIVE') {
    throw new ForbiddenError('Active department teacher required')
  }
  return actor
}

async function activeHead(tx: Prisma.TransactionClient, teacherId: string) {
  const actor = await activeActor(tx, teacherId)
  if (actor.position !== 'DEPARTMENT_HEAD') throw new ForbiddenError('Current department head required')
  return actor
}

export async function get(teacherId: string) {
  return runSerializable(async (tx) => {
    const actor = await activeActor(tx, teacherId)
    const group = await repo.findGroup(tx, actor.departmentId!)
    if (!group) throw new NotFoundError('Department review group not found')
    if (actor.position !== 'DEPARTMENT_HEAD' && !group.members.some((member) => member.teacherId === teacherId)) {
      throw new ForbiddenError('Review group membership required')
    }
    return { ...group, canManage: actor.position === 'DEPARTMENT_HEAD' }
  })
}

export async function create(teacherId: string, name: string) {
  try {
    return await runSerializable(async (tx) => {
      const actor = await activeHead(tx, teacherId)
      if (await repo.findGroup(tx, actor.departmentId!)) throw new ConflictError('Department already has a review group')
      await tx.departmentReviewGroup.create({
        data: {
          departmentId: actor.departmentId!,
          name,
          createdById: teacherId,
          members: { create: { teacherId } },
        },
      })
      return repo.findGroup(tx, actor.departmentId!)
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Department already has a review group')
    }
    throw error
  }
}

export async function rename(teacherId: string, name: string) {
  return runSerializable(async (tx) => {
    const actor = await activeHead(tx, teacherId)
    const group = await repo.findGroup(tx, actor.departmentId!)
    if (!group) throw new NotFoundError('Department review group not found')
    await tx.departmentReviewGroup.update({ where: { id: group.id }, data: { name } })
    return repo.findGroup(tx, actor.departmentId!)
  })
}

export async function setStatus(teacherId: string, status: 'ACTIVE' | 'INACTIVE') {
  return runSerializable(async (tx) => {
    const actor = await activeHead(tx, teacherId)
    const group = await repo.findGroup(tx, actor.departmentId!)
    if (!group) throw new NotFoundError('Department review group not found')
    if (status === 'INACTIVE' && (await repo.hasOpenRounds(tx, group.id) || await tx.questionBankItem.count({
      where: { status: 'PENDING', removedAt: null, question: { subject: { departmentId: actor.departmentId! } } },
    }))) {
      throw new ConflictError('Resolve pending exams and questions before deactivating the group')
    }
    if (status !== group.status) await tx.departmentReviewGroup.update({ where: { id: group.id }, data: { status } })
    return repo.findGroup(tx, actor.departmentId!)
  })
}

export async function listCandidates(teacherId: string) {
  return runSerializable(async (tx) => {
    const actor = await activeHead(tx, teacherId)
    return repo.listCandidates(tx, actor.departmentId!)
  })
}

export async function addMember(teacherId: string, actorUserId: string, memberTeacherId: string) {
  return runSerializable(async (tx) => {
    const actor = await activeHead(tx, teacherId)
    const departmentId = actor.departmentId!
    const group = await repo.findGroup(tx, departmentId)
    if (!group) throw new NotFoundError('Department review group not found')
    const candidate = await repo.findCandidate(tx, memberTeacherId)
    if (!candidate || candidate.status !== 'ACTIVE' || candidate.user.status !== 'ACTIVE') {
      throw new NotFoundError('Active teacher not found')
    }
    if (candidate.departmentId !== departmentId) throw new ForbiddenError('Teacher belongs to another department')
    const previous = await tx.departmentReviewMember.findUnique({
      where: { groupId_teacherId: { groupId: group.id, teacherId: memberTeacherId } },
    })
    if (previous?.status === 'ACTIVE') throw new ConflictError('Teacher is already a group member')
    if (previous) {
      await tx.departmentReviewMember.update({
        where: { id: previous.id }, data: { status: 'ACTIVE', joinedAt: new Date(), leftAt: null },
      })
    } else {
      await tx.departmentReviewMember.create({ data: { groupId: group.id, teacherId: memberTeacherId } })
    }
    await repo.refreshOpenRounds(tx, group.id, departmentId)
    await tx.auditLog.create({ data: {
      userId: actorUserId, action: 'REVIEW_GROUP_MEMBER_ADDED', entityType: 'DepartmentReviewGroup', entityId: group.id,
      metadata: { teacherId: memberTeacherId, before: previous?.status ?? null, after: 'ACTIVE' },
    } })
    return repo.findGroup(tx, departmentId)
  })
}

export async function removeMember(teacherId: string, actorUserId: string, memberTeacherId: string) {
  return runSerializable(async (tx) => {
    const actor = await activeHead(tx, teacherId)
    const departmentId = actor.departmentId!
    const group = await repo.findGroup(tx, departmentId)
    if (!group) throw new NotFoundError('Department review group not found')
    if (memberTeacherId === teacherId) throw new ForbiddenError('Current head must remain in the review group')
    const candidate = await repo.findCandidate(tx, memberTeacherId)
    if (candidate?.departmentId === departmentId && candidate.position === 'DEPARTMENT_HEAD' && candidate.status === 'ACTIVE') {
      throw new ForbiddenError('Current head must remain in the review group')
    }
    const member = await tx.departmentReviewMember.findUnique({
      where: { groupId_teacherId: { groupId: group.id, teacherId: memberTeacherId } },
    })
    if (!member || member.status !== 'ACTIVE') throw new NotFoundError('Active group member not found')
    await tx.departmentReviewMember.update({
      where: { id: member.id }, data: { status: 'INACTIVE', leftAt: new Date() },
    })
    await repo.refreshOpenRounds(tx, group.id, departmentId)
    await tx.auditLog.create({ data: {
      userId: actorUserId, action: 'REVIEW_GROUP_MEMBER_REMOVED', entityType: 'DepartmentReviewGroup', entityId: group.id,
      metadata: { teacherId: memberTeacherId, before: 'ACTIVE', after: 'INACTIVE' },
    } })
    return repo.findGroup(tx, departmentId)
  })
}
