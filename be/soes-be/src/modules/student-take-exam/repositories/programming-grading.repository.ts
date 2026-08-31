import type { ProgrammingSubmissionStatus, ProgrammingTestResultStatus } from '@prisma/client'
import { randomUUID } from 'crypto'
import prisma from '../../../lib/prisma'

export function findProgrammingAnswers(attemptId: string) {
  return prisma.examAttempt.findUniqueOrThrow({
    where: { id: attemptId },
    select: {
      attemptQuestions: {
        where: { examQuestion: { type: 'PROGRAMMING' } },
        select: {
          examQuestion: {
            select: {
              id: true, points: true, language: true,
              programmingConfig: true,
              programmingTests: { orderBy: { id: 'asc' } },
            },
          },
        },
      },
      studentAnswers: {
        where: { examQuestion: { type: 'PROGRAMMING' } },
        select: { examQuestionId: true, draftSourceCode: true },
      },
    },
  })
}

interface TestResultInput {
  testCaseId: string
  status: ProgrammingTestResultStatus
  actualOutput: string | null
  executionTimeMs: number | null
  memoryUsedKb: number | null
  errorMessage: string | null
}

interface ProgrammingGradeInput {
  attemptId: string
  questionId: string
  sourceCode: string
  language: 'JAVA' | 'C' | 'CPP'
  status: ProgrammingSubmissionStatus
  score: number | null
  passedTestCases: number
  totalTestCases: number
  compilerOutput: string | null
  runtimeError: string | null
  testResults: TestResultInput[]
}

export function saveProgrammingGrade(input: ProgrammingGradeInput) {
  return prisma.$transaction(async (tx) => {
    const submissionNo = await tx.programmingSubmission.count({
      where: { attemptId: input.attemptId, examQuestionId: input.questionId },
    }) + 1
    const submission = await tx.programmingSubmission.create({
      data: {
        clientRequestId: randomUUID(),
        submissionNo,
        sourceCode: input.sourceCode,
        language: input.language,
        status: input.status,
        score: input.score,
        passedTestCases: input.passedTestCases,
        totalTestCases: input.totalTestCases,
        compilerOutput: input.compilerOutput,
        runtimeError: input.runtimeError,
        attemptId: input.attemptId,
        examQuestionId: input.questionId,
        testResults: { create: input.testResults },
      },
    })
    await tx.studentAnswer.upsert({
      where: {
        attemptId_examQuestionId: {
          attemptId: input.attemptId,
          examQuestionId: input.questionId,
        },
      },
      update: {
        score: input.score,
        isCorrect: input.status === 'SYSTEM_ERROR' ? null : input.status === 'ACCEPTED',
      },
      create: {
        attemptId: input.attemptId,
        examQuestionId: input.questionId,
        draftSourceCode: input.sourceCode,
        score: input.score,
        isCorrect: input.status === 'SYSTEM_ERROR' ? null : input.status === 'ACCEPTED',
      },
    })
    return submission
  })
}
