import { randomUUID } from 'node:crypto'
import type { Prisma } from '@prisma/client'
import redis from '../../../lib/redis'
import { ConflictError, TooManyRequestsError } from '../../../errors/AppError'
import { logger } from '../../../lib/logger'

const LEASE_MS = 15 * 60_000
const leaseKey = (studentId: string) => `soes:practice-generation:${studentId}`
const renewScript = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('PEXPIRE', KEYS[1], ARGV[2])
  end
  return 0
`
const releaseScript = `
  if redis.call('GET', KEYS[1]) == ARGV[1] then
    return redis.call('DEL', KEYS[1])
  end
  return 0
`

export async function withPracticeGenerationLease<T>(studentId: string, work: (token: string) => Promise<T>) {
  const token = randomUUID()
  const key = leaseKey(studentId)
  const claimed = await redis.set(key, token, 'PX', LEASE_MS, 'NX')
  if (!claimed) throw new ConflictError('A practice generation is already in progress')
  let renewing = false
  const renewal = setInterval(() => {
    if (renewing) return
    renewing = true
    void redis.eval(renewScript, 1, key, token, LEASE_MS)
      .catch(error => logger.warn('Practice lease renewal failed', { error: String(error) }))
      .finally(() => { renewing = false })
  }, 60_000)
  renewal.unref()
  try { return await work(token) }
  finally {
    clearInterval(renewal)
    await redis.eval(releaseScript, 1, key, token)
      .catch(error => logger.warn('Practice lease release failed', { error: String(error) }))
  }
}

export async function assertPracticeGenerationLease(tx: Prisma.TransactionClient, studentId: string, token: string) {
  if (await redis.get(leaseKey(studentId)) !== token) {
    throw new ConflictError('Practice generation ownership has changed')
  }
  const [student] = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id" FROM "Student" WHERE "id" = ${studentId} FOR UPDATE
  `
  if (!student) throw new ConflictError('Student is no longer available')
  const recent = await tx.practiceSet.count({
    where: { studentId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60_000) } },
  })
  if (recent >= 10) throw new TooManyRequestsError('Daily practice generation limit reached')
}
