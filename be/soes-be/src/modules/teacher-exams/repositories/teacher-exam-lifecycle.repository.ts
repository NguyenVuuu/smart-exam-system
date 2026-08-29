import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { createExamQuestion, deleteExamQuestions } from './exam-question-snapshot.repository'
import { examInclude } from './teacher-exams.repository'

export const transitionExam = (
  id: string,
  expected: Prisma.ExamWhereInput,
  data: Prisma.ExamUpdateManyMutationInput,
) => prisma.exam.updateMany({ where: { id, ...expected }, data })

export function reviewExam(id: string, reviewerId: string, approved: boolean, reason?: string) {
  return prisma.$transaction(async (tx) => {
    const claimed = await tx.exam.updateMany({
      where: { id, approvalStatus: 'PENDING' },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        status: approved ? 'READY' : 'DRAFT',
        reviewedAt: new Date(),
        rejectionReason: approved ? null : reason,
      },
    })
    if (!claimed.count) return null
    return tx.exam.update({
      where: { id }, data: { reviewedBy: { connect: { id: reviewerId } } }, include: examInclude,
    })
  })
}

export function copyExam(sourceId: string, teacherId: string) {
  return prisma.$transaction(async (tx) => {
    const source = await tx.exam.findUniqueOrThrow({
      where: { id: sourceId },
      include: {
        sections: true,
        examQuestions: { include: { options: true, programmingConfig: true, programmingTests: true } },
      },
    })
    const copy = await tx.exam.create({
      data: {
        title: `${source.title} - Bản sao`,
        description: source.description,
        subjectId: source.subjectId,
        defaultDurationMinutes: source.defaultDurationMinutes,
        totalPoints: source.totalPoints,
        format: source.format,
        type: source.type,
        creationMethod: source.creationMethod,
        createdById: teacherId,
        status: 'DRAFT',
        approvalStatus: 'NOT_REQUIRED',
      },
    })
    const sectionIds = new Map<string, string>()
    for (const section of source.sections) {
      const copied = await tx.examSection.create({
        data: {
          examId: copy.id,
          title: section.title,
          description: section.description,
          type: section.type,
          targetPoints: section.targetPoints,
          orderIndex: section.orderIndex,
        },
      })
      sectionIds.set(section.id, copied.id)
    }
    for (const question of source.examQuestions) {
      await createExamQuestion(tx, copy.id, {
        question,
        sourceQuestionId: question.sourceQuestionId,
        points: Number(question.points),
        orderIndex: question.orderIndex,
        sectionId: question.sectionId ? sectionIds.get(question.sectionId) : undefined,
      })
    }
    return tx.exam.findUniqueOrThrow({ where: { id: copy.id }, include: examInclude })
  })
}

export function deleteDraftExam(examId: string, teacherId: string) {
  return prisma.$transaction(async (tx) => {
    const exam = await tx.exam.findFirst({
      where: { id: examId, createdById: teacherId, status: 'DRAFT', approvalStatus: { not: 'PENDING' } },
      select: { id: true, _count: { select: { schedules: true } } },
    })
    if (!exam || exam._count.schedules) return false
    await deleteExamQuestions(tx, examId)
    return Boolean((await tx.exam.deleteMany({
      where: { id: examId, createdById: teacherId, status: 'DRAFT' },
    })).count)
  })
}
