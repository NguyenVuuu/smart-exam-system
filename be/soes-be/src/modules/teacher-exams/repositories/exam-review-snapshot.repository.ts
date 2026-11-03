import { Prisma } from '@prisma/client'
import { NotFoundError } from '../../../errors/AppError'
import { decryptField, decryptNullable, encryptField } from '../../../lib/encryption'
import { openExamOption } from '../../../lib/exam-option-secret'

type SnapshotEnvelope = { format: 'AES_256_GCM_V1'; ciphertext: string }

export function sealReviewSnapshot(snapshot: unknown): Prisma.JsonObject {
  return {
    format: 'AES_256_GCM_V1',
    ciphertext: encryptField(JSON.stringify(snapshot)),
  } satisfies SnapshotEnvelope
}

export function openReviewSnapshot(value: Prisma.JsonValue): Prisma.JsonObject {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'format' in value) {
    if (value.format !== 'AES_256_GCM_V1' || typeof value.ciphertext !== 'string'
      || !value.ciphertext.startsWith('enc:')) {
      throw new Error('Invalid encrypted review snapshot')
    }
    const opened: unknown = JSON.parse(decryptField(value.ciphertext))
    if (!opened || typeof opened !== 'object' || Array.isArray(opened)) {
      throw new Error('Invalid review snapshot content')
    }
    return opened as Prisma.JsonObject
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Invalid review snapshot content')
  }
  return value as Prisma.JsonObject
}

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

  // Seal the complete snapshot, including answer keys and programming tests.
  const decrypted = {
    ...exam,
    examQuestions: exam.examQuestions.map((q) => ({
      ...q,
      title: decryptField(q.title),
      content: decryptField(q.content),
      explanation: decryptNullable(q.explanation),
        options: q.options.map((o) => ({ ...o, ...openExamOption(o) })),
    })),
  }

  return sealReviewSnapshot(decrypted)
}
