import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from '../../../errors/AppError'
import { Prisma } from '@prisma/client'
import * as repo from '../repositories/learning-topics.repository'
import type { CreateTopicInput } from '../validators/learning-topics.validator'

async function requireSubject(teacherId: string, subjectId: string) {
  const teacher = await repo.findTeacher(teacherId)
  if (teacher?.status !== 'ACTIVE' || teacher.user.status !== 'ACTIVE' || !teacher.departmentId) {
    throw new ForbiddenError('Active teacher department required')
  }
  if (!await repo.findSubject(subjectId, teacher.departmentId)) throw new NotFoundError('Subject not found')
}

export async function list(teacherId: string, subjectId: string) {
  await requireSubject(teacherId, subjectId)
  return repo.listTopics(subjectId)
}

export async function create(teacherId: string, subjectId: string, input: CreateTopicInput) {
  await requireSubject(teacherId, subjectId)
  try {
    return await repo.createTopic(subjectId, input)
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new ConflictError('Topic code already exists in this subject')
    }
    throw error
  }
}

export async function assign(teacherId: string, userId: string, questionId: string, topicIds: string[]) {
  const teacher = await repo.findTeacher(teacherId)
  if (teacher?.status !== 'ACTIVE' || teacher.user.status !== 'ACTIVE') {
    throw new ForbiddenError('Active teacher required')
  }
  const result = await repo.assignQuestionTopics(questionId, teacherId, userId, topicIds)
  if (result.status === 'NOT_FOUND') throw new NotFoundError('Question not found')
  if (result.status === 'INVALID') throw new ValidationError('Topics must belong to question subject')
  return { topicIds: result.topicIds }
}
