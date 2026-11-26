import prisma from '../../../lib/prisma'
import { assertGradingClaim } from './grading-job.repository'
import { Prisma, type AttemptStatus } from '@prisma/client'
import { openExamOption } from '../../../lib/exam-option-secret'

const sameIds = (left: string[], right: string[]) => {
  const sortedRight = [...right].sort()
  return left.length === right.length && [...left].sort().every((id, index) => id === sortedRight[index])
}

const multiChoiceScore = (selectedIds: string[], correctIds: string[], points: number) => {
  if (correctIds.length === 0) return 0
  const selected = new Set(selectedIds)
  const correctSelectedCount = correctIds.filter((id) => selected.has(id)).length
  return (points / correctIds.length) * correctSelectedCount
}

export function gradeObjectiveAnswers(attemptId: string, options?: { finalStatus?: AttemptStatus; claimToken?: string }) {
  return prisma.$transaction(async (tx) => {
    await assertGradingClaim(tx, attemptId, options?.claimToken)
    const attempt = await tx.examAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      select: {
        manualScore: true,
        examSchedule: { select: { resultReleaseMode: true } },
        attemptQuestions: {
          select: { examQuestion: { select: {
            id: true, type: true, points: true,
            options: { select: { id: true, content: true, isCorrect: true } },
          } } },
        },
        studentAnswers: { select: { id: true, examQuestionId: true, selectedOptionIds: true, score: true } },
      },
    })
    const answers = new Map(attempt.studentAnswers.map((answer) => [answer.examQuestionId, answer]))
    let autoScore = 0
    let requiresManualGrading = false
    const grades: Prisma.Sql[] = []

    for (const { examQuestion } of attempt.attemptQuestions) {
      if (examQuestion.type === 'PROGRAMMING') {
        const answer = answers.get(examQuestion.id)
        requiresManualGrading ||= answer?.score === null || answer?.score === undefined
        autoScore += Number(answer?.score ?? 0)
        continue
      }
      const answer = answers.get(examQuestion.id)
      if (!answer) continue
      const correctIds = examQuestion.options.filter((option) => openExamOption(option).isCorrect).map(({ id }) => id)
      const points = Number(examQuestion.points)
      const isCorrect = sameIds(answer.selectedOptionIds, correctIds)
      const score = examQuestion.type === 'MULTIPLE_CHOICE'
        ? multiChoiceScore(answer.selectedOptionIds, correctIds, points)
        : isCorrect ? points : 0
      autoScore += score
      grades.push(Prisma.sql`(${answer.id}::text, ${isCorrect}::boolean, ${score}::numeric)`)
    }

    if (grades.length) {
      await tx.$executeRaw`
        UPDATE "StudentAnswer" AS answer
        SET "isCorrect" = grade.correct, "score" = grade.score
        FROM (VALUES ${Prisma.join(grades)}) AS grade(id, correct, score)
        WHERE answer."id" = grade.id AND answer."attemptId" = ${attemptId}
      `
    }

    const isImmediate = attempt.examSchedule?.resultReleaseMode === 'IMMEDIATE'
    let finalStatus: AttemptStatus
    if (requiresManualGrading) {
      finalStatus = 'GRADING'
    } else if (isImmediate) {
      // Ca thi cấu hình công bố điểm ngay -> tự động chốt điểm khi kết thúc bài làm
      finalStatus = 'PUBLISHED'
    } else {
      finalStatus = options?.finalStatus ?? 'GRADED'
    }

    return tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        ...(options?.claimToken ? { gradingPending: false, gradingClaimToken: null, gradingLeaseUntil: null, gradingRetryAt: null } : {}),
        autoScore,
        totalScore: autoScore,
        manualScore: finalStatus === 'PUBLISHED' ? autoScore : attempt.manualScore,
        status: finalStatus,
        version: { increment: 1 },
      },
    })
  })
}
