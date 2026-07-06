import { PrismaClient } from '@prisma/client'

export async function seedExamAttemptQuestions(prisma: PrismaClient): Promise<void> {
  console.log('Seeding Exam Attempt Questions...')

  // Fetch all submitted attempts that don't yet have attemptQuestions
  const attempts = await prisma.examAttempt.findMany({
    where: { status: 'SUBMITTED' },
    include: {
      attemptQuestions: { select: { id: true } },
      exam: {
        include: {
          examQuestions: {
            select: { questionId: true },
            orderBy: { id: 'asc' },
          },
        },
      },
    },
  })

  let total = 0

  for (const attempt of attempts) {
    if (attempt.attemptQuestions.length > 0) continue // already seeded

    const rows = attempt.exam.examQuestions.map((eq, index) => ({
      attemptId: attempt.id,
      questionId: eq.questionId,
      orderIndex: index + 1,
    }))

    if (rows.length === 0) continue

    await prisma.examAttemptQuestion.createMany({ data: rows })
    total += rows.length
  }

  console.log(`✓ Exam Attempt Questions completed (${total} created)`)
}
