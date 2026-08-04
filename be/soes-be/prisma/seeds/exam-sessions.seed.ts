import { PrismaClient, ExamSession, ExamAttempt } from '@prisma/client'

export async function seedExamSessions(prisma: PrismaClient): Promise<ExamSession[]> {
  console.log('Seeding Exam Sessions...')

  // Get all exam attempts (include SUBMITTED for demo)
  const examAttempts = await prisma.examAttempt.findMany({
    where: {
      OR: [
        { status: 'IN_PROGRESS' },
        { 
          status: 'SUBMITTED',
          submittedAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Submitted in last 7 days
          }
        }
      ]
    },
    take: 15, // Seed sessions for first 15 attempts
  })

  const allExamSessions: ExamSession[] = []

  const devices = [
    'Windows 10/Chrome 120.0',
    'Windows 11/Edge 119.0',
    'macOS 14.0/Safari 17.0',
    'Linux/Firefox 121.0',
    'Android/Chrome Mobile 120.0',
    'iOS/Safari Mobile 17.0'
  ]

  for (const attempt of examAttempts) {
    // Check if session already exists
    const existingSession = await prisma.examSession.findUnique({
      where: { attemptId: attempt.id }
    })

    if (existingSession) {
      allExamSessions.push(existingSession)
      continue
    }

    const deviceInfo = devices[Math.floor(Math.random() * devices.length)]
    const isOnline = attempt.status === 'IN_PROGRESS'
    
    // Calculate last heartbeat (within last 5 minutes if online, older if not)
    const lastHeartbeat = new Date()
    if (isOnline) {
      lastHeartbeat.setMinutes(lastHeartbeat.getMinutes() - Math.floor(Math.random() * 5))
    } else {
      lastHeartbeat.setMinutes(lastHeartbeat.getMinutes() - 10 - Math.floor(Math.random() * 50))
    }

    const examSession = await prisma.examSession.create({
      data: {
        socketId: isOnline ? `socket-${Math.random().toString(36).substring(7)}` : null,
        ipAddress: `10.0.0.${Math.floor(Math.random() * 255)}`,
        deviceInfo,
        lastHeartbeat,
        isOnline,
        attemptId: attempt.id,
      },
    })

    allExamSessions.push(examSession)
  }

  console.log(`✓ Exam Sessions completed (${allExamSessions.length})`)
  return allExamSessions
}