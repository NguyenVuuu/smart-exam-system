import assert from 'node:assert/strict'
import { once } from 'node:events'
import { test } from 'node:test'
import express from 'express'
import { logger } from '../lib/logger'

test('logs route templates with request correlation and no raw URL or credentials', async (context) => {
  const previous = process.env.PERFORMANCE_LOGGING
  process.env.PERFORMANCE_LOGGING = 'true'
  context.after(() => {
    if (previous === undefined) delete process.env.PERFORMANCE_LOGGING
    else process.env.PERFORMANCE_LOGGING = previous
  })
  const { requestPerformance } = await import('./requestPerformance')
  const { currentRequestId } = await import('../lib/performance')
  const logged = context.mock.method(logger, 'info', () => {})
  const app = express()
  app.use(requestPerformance)
  app.get('/private/:id', async (_req, res) => {
    await Promise.resolve()
    res.json({ requestId: currentRequestId() })
  })
  const server = app.listen(0, '127.0.0.1')
  context.after(() => server.close())
  await once(server, 'listening')
  const address = server.address()
  assert(address && typeof address !== 'string')
  const response = await fetch(`http://127.0.0.1:${address.port}/private/fixture-id?token=fixture-token`)
  const { requestId } = await response.json() as { requestId: string }
  assert.equal(logged.mock.calls.length, 1)
  const entry = JSON.stringify(logged.mock.calls[0].arguments)
  assert.match(requestId, /^[0-9a-f-]{36}$/)
  assert(entry.includes(requestId) && entry.includes('/private/:id'))
  assert(!entry.includes('fixture-id') && !entry.includes('fixture-token'))
})
