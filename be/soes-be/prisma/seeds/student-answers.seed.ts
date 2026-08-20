import { PrismaClient } from '@prisma/client'

// Deterministic: given attempt+question, decide if student answers correctly
function answersCorrectly(attemptId: string, examQuestionId: string): boolean {
  let hash = 0
  const str = attemptId + examQuestionId
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
      studentAnswers: { select: { examQuestionId: true } },
      exam: {
        include: {
          examQuestions: {
            select: { id: true, points: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  })

  // Pre-fetch all question options for questions in these exams to avoid N+1
  const examQuestionIds = attempts.flatMap((a) => a.exam.examQuestions.map((eq) => eq.id))

  const allExamQuestionOptions = await prisma.examQuestionOption.findMany({
    where: { examQuestionId: { in: examQuestionIds } },
    select: { id: true, examQuestionId: true, isCorrect: true },
  })

  const optionsByExamQuestion = new Map<string, Array<{ id: string; isCorrect: boolean }>>()
  for (const opt of allExamQuestionOptions) {
    if (!optionsByExamQuestion.has(opt.examQuestionId)) {
      optionsByExamQuestion.set(opt.examQuestionId, [])
    }
    optionsByExamQuestion.get(opt.examQuestionId)!.push({ id: opt.id, isCorrect: opt.isCorrect })
  }

  let total = 0

  for (const attempt of attempts) {
    const answeredExamQuestionIds = new Set(attempt.studentAnswers?.map((a: any) => a.examQuestionId) || [])

    const rows: Array<{
      attemptId: string
      examQuestionId: string
      selectedOptionIds: string[]
      isCorrect: boolean
      score: string
    }> = []

    for (const eq of attempt.exam.examQuestions) {
      if (answeredExamQuestionIds.has(eq.id)) continue

      const options = optionsByExamQuestion.get(eq.id) ?? []
      const correct = answersCorrectly(attempt.id, eq.id)

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
        examQuestionId: eq.id,
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
            examQuestionId: row.examQuestionId,
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
