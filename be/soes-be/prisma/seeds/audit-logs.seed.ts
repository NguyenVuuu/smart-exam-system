import { PrismaClient, AuditLog, User } from '@prisma/client'

interface AuditLogsSeedInput {
  users: User[]
}

export async function seedAuditLogs(
  prisma: PrismaClient,
  { users }: AuditLogsSeedInput,
): Promise<AuditLog[]> {
  console.log('Seeding Audit Logs...')

  const allAuditLogs: AuditLog[] = []
  
  const actions = ['LOGIN', 'LOGOUT', 'CREATE_EXAM', 'UPDATE_EXAM', 'DELETE_EXAM', 'VIEW_EXAM', 'SUBMIT_EXAM', 'CREATE_QUESTION', 'UPDATE_QUESTION']
  const entityTypes = ['User', 'Student', 'Teacher', 'Exam', 'Question', 'CourseOffering', 'Material', 'Post']

  // Create audit logs for each user
  for (const user of users) {
    // Create 3-5 audit logs per user
    const logCount = 3 + Math.floor(Math.random() * 3)
    
    for (let i = 0; i < logCount; i++) {
      const action = actions[Math.floor(Math.random() * actions.length)]
      const entityType = entityTypes[Math.floor(Math.random() * entityTypes.length)]
      const entityId = `entity-${Math.floor(Math.random() * 1000)}`
      
      // Create timestamp within the last 30 days
      const daysAgo = Math.floor(Math.random() * 30)
      const createdAt = new Date()
      createdAt.setDate(createdAt.getDate() - daysAgo)
      createdAt.setHours(Math.floor(Math.random() * 24))
      createdAt.setMinutes(Math.floor(Math.random() * 60))

      const auditLog = await prisma.auditLog.create({
        data: {
          action,
          entityType,
          entityId,
          metadata: {
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            additionalInfo: `Action performed by ${user.fullName}`
          },
          createdAt,
          userId: user.id,
          ipAddress: `10.0.0.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        },
      })

      allAuditLogs.push(auditLog)
    }
  }

  console.log(`✓ Audit Logs completed (${allAuditLogs.length})`)
  return allAuditLogs
}