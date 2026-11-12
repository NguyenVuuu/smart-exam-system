import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestAgent } from './ai-agent.client'

test('rejects an unconfigured agent before making a network request', async () => {
  const previous = process.env.AI_AGENT_ENABLED
  const previousSecret = process.env.AI_AGENT_SHARED_SECRET
  process.env.AI_AGENT_ENABLED = 'false'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  try {
    await assert.rejects(requestAgent('/v1/student/insights', {}), { statusCode: 503 })
  } finally {
    if (previous === undefined) delete process.env.AI_AGENT_ENABLED
    else process.env.AI_AGENT_ENABLED = previous
    if (previousSecret === undefined) delete process.env.AI_AGENT_SHARED_SECRET
    else process.env.AI_AGENT_SHARED_SECRET = previousSecret
  }
})

test('validates agent output and does not expose service errors', async () => {
  const previousEnabled = process.env.AI_AGENT_ENABLED
  const previousSecret = process.env.AI_AGENT_SHARED_SECRET
  const previousFetch = globalThis.fetch
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  globalThis.fetch = async () => new Response(JSON.stringify({ summary: 'unexpected' }), { status: 200 })
  try {
    await assert.rejects(requestAgent('/v1/student/insights', {}), {
      statusCode: 503, message: 'AI assistant is temporarily unavailable',
    })
  } finally {
    globalThis.fetch = previousFetch
    if (previousEnabled === undefined) delete process.env.AI_AGENT_ENABLED
    else process.env.AI_AGENT_ENABLED = previousEnabled
    if (previousSecret === undefined) delete process.env.AI_AGENT_SHARED_SECRET
    else process.env.AI_AGENT_SHARED_SECRET = previousSecret
  }
})
