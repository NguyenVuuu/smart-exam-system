import type { AttemptStatus } from '@prisma/client'
import prisma from '../../../lib/prisma'

export const reviewableSubmissionWhere = (teacherId: string, attemptId: string, examQuestionId: string) => ({
  attemptId, examQuestionId,
  attempt: {
    status: { in: ['AUTO_SUBMITTED', 'GRADED', 'PUBLISHED'] as AttemptStatus[] },
    invalidatedAt: null,
    courseOffering: { teacherId },
  },
  examQuestion: { type: 'PROGRAMMING' as const },
})

export function findReviewableSubmission(teacherId: string, attemptId: string, examQuestionId: string) {
  return prisma.programmingSubmission.findFirst({
    where: reviewableSubmissionWhere(teacherId, attemptId, examQuestionId),
    orderBy: { submissionNo: 'desc' },
    select: {
      id: true, sourceCode: true, language: true, status: true,
      passedTestCases: true, totalTestCases: true,
      examQuestion: { select: { title: true, content: true } },
      testResults: { select: { status: true } },
    },
  })
}
