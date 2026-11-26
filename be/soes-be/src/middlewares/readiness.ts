import type { Request, Response } from 'express'
import prisma from '../lib/prisma'
import redis from '../lib/redis'
import { createReadinessProbe } from '../lib/readiness'

export const readiness = createReadinessProbe({
  database: () => prisma.$queryRaw`SELECT 1`,
  redis: async () => {
    if (redis.status !== 'ready') throw new Error('Redis is not ready')
    await redis.ping()
  },
})

export async function readinessHandler(_req: Request, res: Response) {
  const result = await readiness.check()
  res.set('Cache-Control', 'no-store').status(result.ready ? 200 : 503).json({
    status: result.ready ? 'ready' : 'unavailable', checks: result.checks,
  })
}
