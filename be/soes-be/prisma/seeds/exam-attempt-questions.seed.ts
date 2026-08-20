import { PrismaClient } from '@prisma/client'

export async function seedExamAttemptQuestions(prisma: PrismaClient): Promise<void> {
  console.log('Seeding Exam Attempt Questions...')

  // Fetch all submitted attempts
  const attempts = await prisma.examAttempt.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      attemptQuestions: { select: { examQuestionId: true } },
      exam: {
        include: {
          examQuestions: {
            select: { id: true },
            orderBy: { orderIndex: 'asc' },
          },
        },
      },
    },
  })

  let total = 0

  for (const attempt of attempts) {
    if (attempt.exam.examQuestions.length === 0) continue

    // Get existing exam question IDs for this attempt
    const existingQuestionIds = new Set(attempt.attemptQuestions.map((aq: any) => aq.examQuestionId))

    const rows = attempt.exam.examQuestions
      .filter((eq) => !existingQuestionIds.has(eq.id))
      .map((eq, index) => ({
        attemptId: attempt.id,
        examQuestionId: eq.id,
        displayOrder: index + 1,
        shuffledOptionIds: [],
      }))

    if (rows.length === 0) continue

    await prisma.examAttemptQuestion.createMany({ data: rows })
    total += rows.length
  }

  console.log(`✓ Exam Attempt Questions completed (${total} created)`)
}
