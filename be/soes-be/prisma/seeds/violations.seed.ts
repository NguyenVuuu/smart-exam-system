import { PrismaClient, Violation, ExamAttempt, ViolationType, SeverityLevel } from '@prisma/client'

export async function seedViolations(prisma: PrismaClient): Promise<Violation[]> {
  console.log('Seeding Violations...')

  // Get all exam attempts that are SUBMITTED or EXPIRED
  const examAttempts = await prisma.examAttempt.findMany({
    where: {
      status: { in: ['SUBMITTED', 'AUTO_SUBMITTED'] }
    },
    take: 20, // Seed violations for first 20 attempts
  })

  const allViolations: Violation[] = []
  
  const violationTypes: ViolationType[] = ['TAB_SWITCH', 'FULLSCREEN_EXIT', 'NO_FACE', 'MULTIPLE_FACES', 'INACTIVITY']
  const severityLevels: SeverityLevel[] = ['LOW', 'MEDIUM', 'HIGH']

  for (const attempt of examAttempts) {
    // Create 0-2 violations per attempt
    const violationCount = Math.floor(Math.random() * 3)
    
    for (let i = 0; i < violationCount; i++) {
      const violationType = violationTypes[Math.floor(Math.random() * violationTypes.length)]
      const severity = severityLevels[Math.floor(Math.random() * severityLevels.length)]
      
      const violation = await prisma.violation.create({
        data: {
          violationType,
          severity,
          evidenceUrls: [
            `https://storage.soes.edu.vn/violations/${attempt.id}/screenshot-${i + 1}.jpg`,
            `https://storage.soes.edu.vn/violations/${attempt.id}/video-${i + 1}.mp4`,
          ],
          description: `Vi phạm ${violationType.toLowerCase().replace('_', ' ')} được phát hiện trong lần thi thứ ${attempt.attemptNo}`,
          detectedAt: new Date(attempt.startedAt.getTime() + 1000 * 60 * (i + 1)), // 1, 2, 3 minutes after start
          attemptId: attempt.id,
        },
      })

      allViolations.push(violation)
    }
  }

  console.log(`✓ Violations completed (${allViolations.length})`)
  return allViolations
}
