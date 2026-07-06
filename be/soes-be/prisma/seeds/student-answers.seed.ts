import { PrismaClient } from '@prisma/client'

// Deterministic: given attempt+question, decide if student answers correctly
function answersCorrectly(attemptId: string, questionId: string): boolean {
  let hash = 0
  const str = attemptId + questionId
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) & 0xffffffff
  }
  // ~70% correct rate
  return Math.abs(hash) % 10 < 7
}

export async function seedStudentAnswers(prisma: PrismaClient): Promise<void> {
  console.log('Seeding Student Answers...')

  const attempts = await prisma.examAttempt.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      studentAnswers: { select: { questionId: true } },
      exam: {
        include: {
          examQuestions: {
            select: { questionId: true, points: true },
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  })

  // Pre-fetch all question options for questions in these exams to avoid N+1
  const questionIds = [
    ...new Set(
      attempts.flatMap((a) => a.exam.examQuestions.map((eq) => eq.questionId)),
    ),
  ]

  const allOptions = await prisma.questionOption.findMany({
    where: { questionId: { in: questionIds } },
    select: { id: true, questionId: true, isCorrect: true },
  })

  const optionsByQuestion = new Map<string, Array<{ id: string; isCorrect: boolean }>>()
  for (const opt of allOptions) {
    if (!optionsByQuestion.has(opt.questionId)) {
      optionsByQuestion.set(opt.questionId, [])
    }
    optionsByQuestion.get(opt.questionId)!.push({ id: opt.id, isCorrect: opt.isCorrect })
  }

  let total = 0

  for (const attempt of attempts) {
    const answeredQuestionIds = new Set(attempt.studentAnswers.map((a) => a.questionId))

    const rows: Array<{
      attemptId: string
      questionId: string
      selectedOptionIds: string[]
      isCorrect: boolean
      score: string
    }> = []

    for (const eq of attempt.exam.examQuestions) {
      if (answeredQuestionIds.has(eq.questionId)) continue

      const options = optionsByQuestion.get(eq.questionId) ?? []
      const correct = answersCorrectly(attempt.id, eq.questionId)

      let selectedOptionIds: string[]
      if (options.length === 0) {
        selectedOptionIds = []
      } else if (correct) {
        selectedOptionIds = options.filter((o) => o.isCorrect).map((o) => o.id)
      } else {
        // Pick a wrong answer deterministically
        const wrongOptions = options.filter((o) => !o.isCorrect)
        const pick = wrongOptions.length > 0 ? wrongOptions[0] : options[0]
        selectedOptionIds = [pick.id]
      }

      rows.push({
        attemptId: attempt.id,
        questionId: eq.questionId,
        selectedOptionIds,
        isCorrect: correct,
        score: correct ? Number(eq.points).toFixed(2) : '0.00',
      })
    }

    if (rows.length === 0) continue

    // createMany does not support nested JSON well — insert individually in batch
    await prisma.$transaction(
      rows.map((row) =>
        prisma.studentAnswer.create({
          data: {
            attemptId: row.attemptId,
            questionId: row.questionId,
            selectedOptionIds: row.selectedOptionIds,
            isCorrect: row.isCorrect,
            score: row.score,
          },
        }),
      ),
    )
    total += rows.length
  }

  console.log(`✓ Student Answers completed (${total} created)`)
}
