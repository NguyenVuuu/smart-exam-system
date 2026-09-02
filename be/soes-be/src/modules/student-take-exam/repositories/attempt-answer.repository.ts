import prisma from '../../../lib/prisma'

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
  savedAt: Date,
) {
  await prisma.$transaction([
    prisma.studentAnswer.upsert({
      where: { attemptId_examQuestionId: { attemptId, examQuestionId: questionId } },
      update: { selectedOptionIds, draftSourceCode },
      create: { attemptId, examQuestionId: questionId, selectedOptionIds, draftSourceCode },
    }),
    prisma.examAttempt.update({
      where: { id: attemptId },
      data: { lastSavedAt: savedAt, version: { increment: 1 } },
    }),
  ])
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
                where: { isSample: true },
                select: { id: true, isSample: true, input: true, expectedOutput: true },
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
          programmingTestCases: question.programmingTests,
        }
      : null,
  }
}

export async function upsertStudentAnswerForProgramming(
  attemptId: string,
  questionId: string,
  draftSourceCode: string,
) {
  await prisma.studentAnswer.upsert({
    where: { attemptId_examQuestionId: { attemptId, examQuestionId: questionId } },
    update: { draftSourceCode },
    create: { attemptId, examQuestionId: questionId, draftSourceCode, selectedOptionIds: [] },
  })
}

export async function updateAttemptLastSavedAt(attemptId: string, lastSavedAt: Date) {
  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { lastSavedAt, version: { increment: 1 } },
  })
}
