import { PrismaClient } from '@prisma/client'

export async function seedSettings(prisma: PrismaClient): Promise<void> {
  console.log('Seeding Settings...')

  await prisma.codeGenerationSetting.upsert({
    where: { id: 'SYSTEM' },
    update: {
      studentPrefix: 'US', studentDigits: 6,
      teacherPrefix: 'US', teacherDigits: 6,
      adminPrefix: 'US', adminDigits: 6,
    },
    create: {
      id: 'SYSTEM',
      studentPrefix: 'US',
      studentDigits: 6,
      teacherPrefix: 'US',
      teacherDigits: 6,
      adminPrefix: 'US',
      adminDigits: 6,
    },
  })

  console.log('✓ Settings completed')
}
