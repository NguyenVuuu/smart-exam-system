import prisma from '../../../lib/prisma'
import type { AttemptStatus } from '@prisma/client'
import { openExamOption } from '../../../lib/exam-option-secret'

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && [...left].sort().every((id, index) => id === [...right].sort()[index])

const multiChoiceScore = (selectedIds: string[], correctIds: string[], points: number) => {
  if (correctIds.length === 0) return 0
  const selected = new Set(selectedIds)
  const correctSelectedCount = correctIds.filter((id) => selected.has(id)).length
  return (points / correctIds.length) * correctSelectedCount
}

export function gradeObjectiveAnswers(attemptId: string, options?: { finalStatus?: AttemptStatus }) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.examAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: {
        examSchedule: { select: { resultReleaseMode: true } },
        attemptQuestions: {
          include: { examQuestion: { include: { options: true } } },
        },
        studentAnswers: true,
      },
    })
    const answers = new Map(attempt.studentAnswers.map((answer) => [answer.examQuestionId, answer]))
    let autoScore = 0
    let requiresManualGrading = false

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
      await tx.studentAnswer.update({ where: { id: answer.id }, data: { isCorrect, score } })
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
        autoScore,
        totalScore: autoScore,
        manualScore: finalStatus === 'PUBLISHED' ? autoScore : attempt.manualScore,
        status: finalStatus,
        version: { increment: 1 },
      },
    })
  })
}
