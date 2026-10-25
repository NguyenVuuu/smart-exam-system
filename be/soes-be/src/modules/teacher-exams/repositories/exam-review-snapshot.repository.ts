import { Prisma } from '@prisma/client'
import { NotFoundError } from '../../../errors/AppError'

export async function readExamReviewSnapshot(tx: Prisma.TransactionClient, examId: string): Promise<Prisma.InputJsonValue> {
  const exam = await tx.exam.findUnique({
    where: { id: examId },
    select: {
      id: true, title: true, description: true, type: true, format: true,
      subjectId: true, semesterId: true, defaultDurationMinutes: true, totalPoints: true,
      sections: { orderBy: { orderIndex: 'asc' }, select: {
        id: true, title: true, description: true, type: true, targetPoints: true, orderIndex: true,
      } },
      examQuestions: { orderBy: { orderIndex: 'asc' }, select: {
        id: true, sectionId: true, orderIndex: true, points: true, title: true, content: true,
        explanation: true, type: true, difficulty: true, language: true, sourceQuestionId: true,
        options: { orderBy: { orderIndex: 'asc' } },
        programmingConfig: true,
        programmingTests: true,
      } },
    },
  })
  if (!exam) throw new NotFoundError('Exam not found')
  return JSON.parse(JSON.stringify(exam)) as Prisma.InputJsonValue
}
