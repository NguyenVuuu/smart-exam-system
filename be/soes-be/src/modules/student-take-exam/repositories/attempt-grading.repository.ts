import prisma from '../../../lib/prisma'

const sameIds = (left: string[], right: string[]) =>
  left.length === right.length && [...left].sort().every((id, index) => id === [...right].sort()[index])

export function gradeObjectiveAnswers(attemptId: string) {
  return prisma.$transaction(async (tx) => {
    const attempt = await tx.examAttempt.findUniqueOrThrow({
      where: { id: attemptId },
      include: {
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
      const correctIds = examQuestion.options.filter(({ isCorrect }) => isCorrect).map(({ id }) => id)
      const isCorrect = sameIds(answer.selectedOptionIds, correctIds)
      const score = isCorrect ? Number(examQuestion.points) : 0
      autoScore += score
      await tx.studentAnswer.update({ where: { id: answer.id }, data: { isCorrect, score } })
    }

    return tx.examAttempt.update({
      where: { id: attemptId },
      data: {
        autoScore, totalScore: autoScore,
        status: requiresManualGrading ? 'GRADING' : 'GRADED',
        version: { increment: 1 },
      },
    })
  })
}
