import type { Prisma } from '@prisma/client'
import type { ExamSubmissionDto } from '../dtos/teacher-exam-grading.dto'
import type { submissionInclude } from '../repositories/teacher-exam-grading.repository'

type SubmissionRow = Prisma.ExamAttemptGetPayload<{ include: typeof submissionInclude }>

export function toExamSubmissionDto(row: SubmissionRow): ExamSubmissionDto {
  const latestSubmissionByQuestion = new Map(
    row.programmingSubmissions.map((submission) => [submission.examQuestionId, submission]),
  )
  const sections = new Map(row.examSchedule.exam.sections.map((section) => [section.id, {
    id: section.id, title: section.title, score: 0, maxScore: Number(section.targetPoints),
  }]))
  for (const answer of row.studentAnswers) {
    const section = answer.examQuestion.section
    if (!section) continue
    const current = sections.get(section.id) ?? {
      id: section.id, title: section.title, score: 0, maxScore: Number(section.targetPoints),
    }
    current.score += Number(answer.score ?? 0)
    sections.set(section.id, current)
  }
  const answerByQuestion = new Map(row.studentAnswers.map((answer) => [answer.examQuestionId, {
    questionId: answer.examQuestionId,
    selectedOptionIds: answer.selectedOptionIds,
    sourceCode: latestSubmissionByQuestion.get(answer.examQuestionId)?.sourceCode ?? answer.draftSourceCode,
    score: answer.score === null ? null : Number(answer.score),
  }]))
  for (const submission of latestSubmissionByQuestion.values()) {
    if (answerByQuestion.has(submission.examQuestionId)) continue
    answerByQuestion.set(submission.examQuestionId, {
      questionId: submission.examQuestionId,
      selectedOptionIds: [],
      sourceCode: submission.sourceCode,
      score: submission.score === null ? null : Number(submission.score),
    })
  }

  return {
    id: row.id, examId: row.examSchedule.examId, scheduleId: row.examScheduleId,
    attemptId: row.id, studentId: row.studentId, studentCode: row.student.studentCode,
    studentName: row.student.user.fullName, submittedAt: row.submittedAt,
    autoScore: row.autoScore === null ? null : Number(row.autoScore),
    manualScoreOverride: row.manualScore === null ? null : Number(row.manualScore),
    finalScore: row.totalScore === null ? null : Number(row.totalScore), status: row.status,
    sectionScores: [...sections.values()],
    answers: [...answerByQuestion.values()],
    codingResults: [...latestSubmissionByQuestion.values()].flatMap((submission) =>
      submission.testResults.map((result) => ({
        questionId: submission.examQuestionId,
        testCaseId: result.testCaseId,
        passed: result.status === 'PASSED',
        input: result.testCase.input,
        expectedOutput: result.testCase.expectedOutput,
        actualOutput: result.actualOutput,
        executionTimeMs: result.executionTimeMs ?? 0,
        memoryKb: result.memoryUsedKb ?? 0,
      })),
    ),
  }
}
