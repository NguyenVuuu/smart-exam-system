import { PrismaClient } from '@prisma/client'

export async function seedSettings(prisma: PrismaClient): Promise<void> {
  console.log('Seeding Settings...')

  await prisma.codeGenerationSetting.upsert({
    where: { id: 'SYSTEM' },
    update: {},
    create: {
      id: 'SYSTEM',
      studentPrefix: 'SV',
      studentDigits: 6,
      teacherPrefix: 'GV',
      teacherDigits: 6,
      adminPrefix: 'AD',
      adminDigits: 6,
    },
  })

  console.log('✓ Settings completed')
}
