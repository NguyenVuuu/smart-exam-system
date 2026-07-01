import Redis from 'ioredis'
import { logger } from './logger'

const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  lazyConnect: false,
  retryStrategy: (times) => {
    if (times >= 3) return null // stop retrying
    return Math.min(times * 200, 1000)
  },
})

redis.on('connect', () => logger.info('Redis connected'))
redis.on('error', (err) => logger.error('Redis error', { error: String(err) }))

export default redis

// ── Token keys ────────────────────────────────────────────

const REFRESH_PREFIX = 'refresh:'
const BLACKLIST_PREFIX = 'blacklist:'

export const refreshTokenStore = {
  async set(userId: string, token: string, ttlSeconds: number): Promise<void> {
    await redis.set(`${REFRESH_PREFIX}${userId}`, token, 'EX', ttlSeconds)
  },

  async get(userId: string): Promise<string | null> {
    return redis.get(`${REFRESH_PREFIX}${userId}`)
  },

  async delete(userId: string): Promise<void> {
    await redis.del(`${REFRESH_PREFIX}${userId}`)
  },
}

export const tokenBlacklist = {
  async add(jti: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) return
    await redis.set(`${BLACKLIST_PREFIX}${jti}`, '1', 'EX', ttlSeconds)
  },

  async isBlacklisted(jti: string): Promise<boolean> {
    const val = await redis.get(`${BLACKLIST_PREFIX}${jti}`)
    return val !== null
  },
}
