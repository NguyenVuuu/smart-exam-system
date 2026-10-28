import { Prisma } from '@prisma/client'
import { NotFoundError } from '../../../errors/AppError'
import { decryptField, decryptNullable } from '../../../lib/encryption'

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

  // Decrypt sensitive fields before storing in snapshot JSON
  const decrypted = {
    ...exam,
    examQuestions: exam.examQuestions.map((q) => ({
      ...q,
      title: decryptField(q.title),
      content: decryptField(q.content),
      explanation: decryptNullable(q.explanation),
      options: q.options.map((o) => ({
        ...o,
        content: decryptField(o.content),
      })),
    })),
  }

  return JSON.parse(JSON.stringify(decrypted)) as Prisma.InputJsonValue
}
