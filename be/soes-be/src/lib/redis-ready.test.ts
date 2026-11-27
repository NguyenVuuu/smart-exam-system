import assert from 'node:assert/strict'
import { EventEmitter } from 'node:events'
import { test } from 'node:test'
import { waitForRedisReady } from './redis-ready'

class Connection extends EventEmitter {
  status: 'connecting' | 'ready' | 'end' = 'connecting'
}

test('Redis readiness resolves and removes temporary listeners', async () => {
  const client = new Connection()
  const pending = waitForRedisReady(client)
  client.emit('ready')
  await pending
  assert.equal(client.eventNames().length, 0)
  client.status = 'ready'
  await waitForRedisReady(client)
  assert.equal(client.eventNames().length, 0)
})

test('Redis failure, end and timeout reject without retaining listeners', async () => {
  for (const event of ['error', 'end', 'timeout'] as const) {
    const client = new Connection()
    const pending = waitForRedisReady(client, 10)
    if (event !== 'timeout') client.emit(event, new Error('Unavailable'))
    await assert.rejects(pending)
    assert.equal(client.eventNames().length, 0)
  }
  const ended = new Connection()
  ended.status = 'end'
  await assert.rejects(waitForRedisReady(ended))
  assert.equal(ended.eventNames().length, 0)
})
