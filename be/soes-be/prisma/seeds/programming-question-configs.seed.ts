import { PrismaClient, ProgrammingQuestionConfig, ExamQuestion } from '@prisma/client'

interface ProgrammingQuestionConfigSeedInput {
  examQuestions: ExamQuestion[]
}

export async function seedProgrammingQuestionConfigs(
  prisma: PrismaClient,
  { examQuestions }: ProgrammingQuestionConfigSeedInput,
): Promise<void> {
  console.log('Seeding ProgrammingQuestionConfigs...')

  // Find programming questions (questions without options in source)
  const programmingQuestions = examQuestions.filter((eq) => eq.type === 'PROGRAMMING')

  for (const eq of programmingQuestions) {
    const existing = await prisma.programmingQuestionConfig.findUnique({
      where: { examQuestionId: eq.id },
    })
    if (existing) continue

    await prisma.programmingQuestionConfig.create({
      data: {
        timeLimitMs: 2000,
        memoryLimitKb: 262144,
        maxCodeSizeKb: 256,
        examQuestionId: eq.id,
      },
    })
  }

  console.log(`✓ ProgrammingQuestionConfigs completed`)
}
