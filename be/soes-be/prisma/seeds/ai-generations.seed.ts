import { PrismaClient, AIGenerationHistory, CourseOffering, Teacher } from '@prisma/client'

interface AIGenerationSeedInput {
  courseOfferings: CourseOffering[]
  teachers: Teacher[]
}

export async function seedAIGenerationHistories(
  prisma: PrismaClient,
  { courseOfferings, teachers }: AIGenerationSeedInput,
): Promise<AIGenerationHistory[]> {
  console.log('Seeding AIGenerationHistories...')

  const allHistories: AIGenerationHistory[] = []

  // Create one AI generation history per course offering
  for (let i = 0; i < courseOfferings.length; i++) {
    const offering = courseOfferings[i]
    const teacher = teachers[i % teachers.length]

    // Check if AI generation already exists for this course offering
    const existing = await prisma.aIGenerationHistory.findFirst({
      where: { courseOfferingId: offering.id, teacherId: teacher.id },
    })
    if (existing) { allHistories.push(existing); continue }

    const history = await prisma.aIGenerationHistory.create({
      data: {
        prompt: 'Generate 5 programming questions for Java beginners about basic syntax and control flow.',
        aiModel: 'gpt-4',
        questionCount: 5,
        status: 'COMPLETED',
        teacherId: teacher.id,
        courseOfferingId: offering.id,
        materials: {
          create: [],
        },
        questions: {
          create: [],
        },
      },
    })
    allHistories.push(history)
  }

  console.log(`✓ AIGenerationHistories completed (${allHistories.length})`)
  return allHistories
}
