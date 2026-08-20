import { PrismaClient, ProgrammingTestCase, ExamQuestion } from '@prisma/client'

interface ProgrammingTestCaseSeedInput {
  examQuestions: ExamQuestion[]
}

export async function seedProgrammingTestCases(
  prisma: PrismaClient,
  { examQuestions }: ProgrammingTestCaseSeedInput,
): Promise<void> {
  console.log('Seeding ProgrammingTestCases...')

  // Find programming questions (questions without options in source)
  const programmingQuestions = examQuestions.filter((eq) => eq.type === 'PROGRAMMING')

  for (const eq of programmingQuestions) {
    // Check if test cases already exist for this exam question
    const existing = await prisma.programmingTestCase.findFirst({
      where: { examQuestionId: eq.id },
    })
    if (existing) continue

    await prisma.programmingTestCase.createMany({
      data: [
        {
          input: '5\n3',
          expectedOutput: '8',
          weight: 30.00,
          isSample: true,
          isHidden: false,
          examQuestionId: eq.id,
        },
        {
          input: '10\n20',
          expectedOutput: '30',
          weight: 30.00,
          isSample: true,
          isHidden: false,
          examQuestionId: eq.id,
        },
        {
          input: '-5\n10',
          expectedOutput: '5',
          weight: 20.00,
          isSample: false,
          isHidden: true,
          examQuestionId: eq.id,
        },
        {
          input: '0\n0',
          expectedOutput: '0',
          weight: 20.00,
          isSample: false,
          isHidden: true,
          examQuestionId: eq.id,
        },
      ],
    })
  }

  console.log(`✓ ProgrammingTestCases completed`)
}
