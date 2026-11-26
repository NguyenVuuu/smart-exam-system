import prisma from '../../../lib/prisma'
import { decryptField } from '../../../lib/encryption'
import { ConflictError } from '../../../errors/AppError'

export async function findAttemptForAnswer(
  attemptId: string,
  scheduleId: string,
  studentId: string,
  questionId: string,
) {
  return prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      status: true,
      deadlineAt: true,
      attemptQuestions: {
        where: { examQuestionId: questionId },
        select: {
          examQuestion: {
            select: { id: true, type: true, options: { select: { id: true } }, language: true },
          },
        },
      },
    },
  })
}

export async function saveAnswer(
  attemptId: string,
  questionId: string,
  selectedOptionIds: string[],
  draftSourceCode: string | null,
) {
  await prisma.$transaction(async (tx) => {
    const [attempt] = await tx.$queryRaw<Array<{ status: string; deadlineAt: Date }>>`
      SELECT "status", "deadlineAt" FROM "ExamAttempt" WHERE "id" = ${attemptId} FOR UPDATE
    `
    const savedAt = new Date()
    if (attempt?.status !== 'IN_PROGRESS' || attempt.deadlineAt <= savedAt) {
      throw new ConflictError('Exam attempt has ended')
    }
    await tx.studentAnswer.upsert({
      where: { attemptId_examQuestionId: { attemptId, examQuestionId: questionId } },
      update: { selectedOptionIds, draftSourceCode },
      create: { attemptId, examQuestionId: questionId, selectedOptionIds, draftSourceCode },
    })
    await tx.examAttempt.update({
      where: { id: attemptId },
      data: { lastSavedAt: savedAt, version: { increment: 1 } },
    })
  })
}

export async function findProgrammingQuestionWithTestCases(
  questionId: string,
  attemptId: string,
  scheduleId: string,
  studentId: string,
) {
  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, examScheduleId: scheduleId, studentId },
    select: {
      id: true,
      status: true,
      deadlineAt: true,
      examSession: { select: { lastHeartbeat: true } },
      attemptQuestions: {
        where: { examQuestionId: questionId },
        select: {
          examQuestion: {
            select: {
              id: true,
              type: true,
              language: true,
              programmingConfig: {
                select: { maxCodeSizeKb: true, timeLimitMs: true, memoryLimitKb: true },
              },
              programmingTests: {
                orderBy: { id: 'asc' },
                select: { id: true, isSample: true, isHidden: true, input: true, expectedOutput: true },
              },
            },
          },
        },
      },
    },
  })
  if (!attempt?.attemptQuestions[0]) return null
  const question = attempt.attemptQuestions[0].examQuestion
  return {
    attempt: {
      id: attempt.id,
      status: attempt.status,
      deadlineAt: attempt.deadlineAt,
      examSession: attempt.examSession,
    },
    question: question.type === 'PROGRAMMING'
      ? {
          id: question.id,
          type: question.type,
          language: question.language ?? 'UNKNOWN',
          programmingQuestionConfig: question.programmingConfig,
          programmingTestCases: question.programmingTests.map((test) => ({
            ...test, input: decryptField(test.input), expectedOutput: decryptField(test.expectedOutput),
          })),
        }
      : null,
  }
}
