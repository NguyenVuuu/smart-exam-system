import assert from 'node:assert/strict'
import { test } from 'node:test'
import { requestInsightAgent, requestPracticeDraftAgent } from './ai-agent.client'
import { getStoredAiSettings } from '../../admin-system-settings/services/ai-settings-reader'

test('rejects an unconfigured agent before making a network request', async () => {
  const previous = process.env.AI_AGENT_ENABLED
  const previousSecret = process.env.AI_AGENT_SHARED_SECRET
  process.env.AI_AGENT_ENABLED = 'false'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  try {
    await assert.rejects(requestInsightAgent('/v1/student/insights', {}), { statusCode: 503 })
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
    await assert.rejects(requestInsightAgent('/v1/student/insights', {}), {
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

test('preserves provider outage and rate limit statuses without exposing upstream details', async () => {
  const previousEnabled = process.env.AI_AGENT_ENABLED
  const previousSecret = process.env.AI_AGENT_SHARED_SECRET
  const previousFetch = globalThis.fetch
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  try {
    for (const [status, message] of [
      [503, 'AI provider is temporarily unavailable'],
      [429, 'AI provider rate limit reached'],
    ] as const) {
      globalThis.fetch = async () => new Response('private-provider-detail', { status })
      await assert.rejects(requestInsightAgent('/v1/student/insights', {}), { statusCode: status, message })
    }
  } finally {
    globalThis.fetch = previousFetch
    if (previousEnabled === undefined) delete process.env.AI_AGENT_ENABLED
    else process.env.AI_AGENT_ENABLED = previousEnabled
    if (previousSecret === undefined) delete process.env.AI_AGENT_SHARED_SECRET
    else process.env.AI_AGENT_SHARED_SECRET = previousSecret
  }
})

test('uses the selected system model for agent workflows', async () => {
  const previousEnabled = process.env.AI_AGENT_ENABLED
  const previousSecret = process.env.AI_AGENT_SHARED_SECRET
  const previousFetch = globalThis.fetch
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  let sentModel = ''
  globalThis.fetch = async (_url, init) => {
    sentModel = JSON.parse(String(init?.body)).model
    return new Response(JSON.stringify({ summary: 'Summary', actions: [], evidenceIds: [], caveat: null }))
  }
  try {
    await requestInsightAgent('/v1/student/insights', { message: 'test' })
    assert.equal(sentModel, (await getStoredAiSettings()).model)
  } finally {
    globalThis.fetch = previousFetch
    if (previousEnabled === undefined) delete process.env.AI_AGENT_ENABLED
    else process.env.AI_AGENT_ENABLED = previousEnabled
    if (previousSecret === undefined) delete process.env.AI_AGENT_SHARED_SECRET
    else process.env.AI_AGENT_SHARED_SECRET = previousSecret
  }
})

test('reports the specific safe reason when practice answers lack material evidence', async () => {
  const previousEnabled = process.env.AI_AGENT_ENABLED
  const previousSecret = process.env.AI_AGENT_SHARED_SECRET
  const previousFetch = globalThis.fetch
  process.env.AI_AGENT_ENABLED = 'true'
  process.env.AI_AGENT_SHARED_SECRET = 'test-secret'
  globalThis.fetch = async () => new Response(JSON.stringify({
    detail: 'Practice answer is not uniquely supported by its source quote',
  }), { status: 422 })
  try {
    await assert.rejects(requestPracticeDraftAgent({}), {
      statusCode: 422,
      message: 'AI could not verify the answers against the selected material',
    })
  } finally {
    globalThis.fetch = previousFetch
    if (previousEnabled === undefined) delete process.env.AI_AGENT_ENABLED
    else process.env.AI_AGENT_ENABLED = previousEnabled
    if (previousSecret === undefined) delete process.env.AI_AGENT_SHARED_SECRET
    else process.env.AI_AGENT_SHARED_SECRET = previousSecret
  }
})
