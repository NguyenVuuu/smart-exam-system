import { NotFoundError, ValidationError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { findReviewableSubmission } from '../repositories/programming-review.repository'
import { requestProgrammingReviewAgent } from './ai-agent.client'

export async function reviewProgrammingSubmission(
  teacherId: string, userId: string, attemptId: string, examQuestionId: string,
) {
  const submission = await findReviewableSubmission(teacherId, attemptId, examQuestionId)
  if (!submission) throw new NotFoundError('Programming submission not found')
  if (!submission.sourceCode.trim() || submission.sourceCode.length > 20_000) {
    throw new ValidationError('Source code is unavailable or too large for AI review')
  }
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_PROGRAMMING_REVIEW', entityType: 'ProgrammingSubmission', entityId: submission.id,
    metadata: { attemptId, examQuestionId },
  })
  const failures = new Map<string, number>()
  for (const result of submission.testResults) {
    if (result.status !== 'PASSED') failures.set(result.status, (failures.get(result.status) ?? 0) + 1)
  }
  return requestProgrammingReviewAgent({
    questionTitle: submission.examQuestion.title.slice(0, 300),
    questionContent: submission.examQuestion.content.slice(0, 5000),
    language: submission.language,
    sourceCode: submission.sourceCode,
    submissionStatus: submission.status,
    passedTestCases: submission.passedTestCases,
    totalTestCases: submission.totalTestCases,
    failureStatuses: [...failures].map(([status, count]) => `${status}: ${count}`),
  })
}
