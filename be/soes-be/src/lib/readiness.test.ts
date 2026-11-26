import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createReadinessProbe } from './readiness'

test('readiness coalesces dependency probes and fails closed during drain', async () => {
  let calls = 0
  let finish!: () => void
  const probe = createReadinessProbe({ database: () => {
    calls++
    return new Promise<void>(resolve => { finish = resolve })
  }, redis: async () => undefined })
  const results = Array.from({ length: 20 }, () => probe.check())
  assert.equal(calls, 1)
  finish()
  assert((await Promise.all(results)).every(result => result.ready))
  assert.equal((await probe.check()).ready, true)
  assert.equal(calls, 1)
  probe.drain()
  assert.equal((await probe.check()).ready, false)
})

test('readiness bounds a hung dependency without spawning more probes', async () => {
  let calls = 0
  const probe = createReadinessProbe({ database: () => {
    calls++
    return new Promise(() => undefined)
  } }, 5)
  assert.equal((await probe.check()).ready, false)
  assert.equal((await probe.check()).ready, false)
  assert.equal(calls, 1)
  const failed = createReadinessProbe({ redis: async () => { throw new Error('private connection detail') } })
  assert.deepEqual(await failed.check(), { ready: false, checks: { redis: false } })
})
