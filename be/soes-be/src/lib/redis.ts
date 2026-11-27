import Redis from 'ioredis'
import { logger } from './logger'
import { AppError } from '../errors/AppError'
import { accountRoles } from '../utils/jwt'

const retryLimit = Number(process.env.REDIS_RETRY_LIMIT ?? 0)
const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: false,
  enableOfflineQueue: false,
  maxRetriesPerRequest: 2,
  retryStrategy: (times) => {
    if (retryLimit > 0 && times >= retryLimit) return null
    return Math.min(200 * 2 ** Math.min(times - 1, 6), 10_000) + Math.floor(Math.random() * 250)
  },
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error', { error: String(err) }))

export default redis

// ── Token keys ────────────────────────────────────────────

const REFRESH_PREFIX = 'refresh:'
const BLACKLIST_PREFIX = 'blacklist:'

export const refreshTokenStore = {
  async set(key: string, token: string, ttlSeconds: number): Promise<void> {
    await redis.set(`${REFRESH_PREFIX}${key}`, token, 'EX', ttlSeconds)
  },

  async get(key: string): Promise<string | null> {
    return redis.get(`${REFRESH_PREFIX}${key}`)
  },

  async delete(key: string): Promise<void> {
    await redis.del(`${REFRESH_PREFIX}${key}`)
  },

  async deleteAllRoles(userId: string): Promise<void> {
    const legacyKey = `${REFRESH_PREFIX}${userId}`
    await redis.del(legacyKey, ...accountRoles.map(role => `${legacyKey}:${role}`))
  },
}

export const tokenBlacklist = {
  async add(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return
    await redis.set(`${BLACKLIST_PREFIX}${jti}`, '1', 'EX', ttlSeconds)
  },

  async isBlacklisted(jti: string): Promise<boolean> {
    try {
      const val = await redis.get(`${BLACKLIST_PREFIX}${jti}`)
      return val !== null
    } catch {
      throw new AppError(503, 'Session validation is temporarily unavailable')
    }
  },
}
