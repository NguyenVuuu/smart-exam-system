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
    return group
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
    if (status === 'INACTIVE' && await repo.hasOpenRounds(tx, group.id)) {
      throw new ConflictError('Cannot deactivate a review group with pending exams')
    }
    if (status !== group.status) await tx.departmentReviewGroup.update({ where: { id: group.id }, data: { status } })
    return repo.findGroup(tx, actor.departmentId!)
  })
}
