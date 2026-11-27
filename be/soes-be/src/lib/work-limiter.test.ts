import assert from 'node:assert/strict'
import { test } from 'node:test'
import { WorkLimiter } from './work-limiter'

test('limits running work, bounds the queue and releases failed work', async () => {
  const limiter = new WorkLimiter(1, 1)
  let finish!: () => void
  const first = limiter.run(() => new Promise<void>(resolve => { finish = resolve }))
  let secondStarted = false
  const second = limiter.run(async () => { secondStarted = true; throw new Error('worker failed') })
  const rejected = assert.rejects(second, /worker failed/)
  await assert.rejects(limiter.run(async () => undefined), /capacity is exhausted/)
  assert.equal(secondStarted, false)
  finish()
  await first
  await rejected
  assert.equal(secondStarted, true)
  assert.equal(await limiter.run(async () => 42), 42)
})

test('expired queued work never starts later', async () => {
  const limiter = new WorkLimiter(1, 1)
  let finish!: () => void
  const first = limiter.run(() => new Promise<void>(resolve => { finish = resolve }))
  let started = false
  await assert.rejects(limiter.run(async () => { started = true }, 5), /queue timed out/)
  finish()
  await first
  assert.equal(started, false)
  assert.equal(await limiter.run(async () => 1), 1)
})
