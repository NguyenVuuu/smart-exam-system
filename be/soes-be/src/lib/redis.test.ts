import assert from 'node:assert/strict'
import { test } from 'node:test'
import redis, { tokenBlacklist } from './redis'
import { AppError } from '../errors/AppError'

test('session validation fails closed on Redis failure and preserves revocation semantics', async context => {
  context.after(() => redis.disconnect())
  let mode: 'outage' | 'revoked' | 'clear' = 'outage'
  context.mock.method(redis, 'get', async () => {
    if (mode === 'outage') throw new Error('private connection detail')
    return mode === 'revoked' ? '1' : null
  })
  await assert.rejects(tokenBlacklist.isBlacklisted('fixture'), error => {
    assert.ok(error instanceof AppError)
    assert.equal(error.statusCode, 503)
    assert.doesNotMatch(error.message, /private connection/)
    return true
  })
  mode = 'revoked'
  assert.equal(await tokenBlacklist.isBlacklisted('fixture'), true)
  mode = 'clear'
  assert.equal(await tokenBlacklist.isBlacklisted('fixture'), false)
})
