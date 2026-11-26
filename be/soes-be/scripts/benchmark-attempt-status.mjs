import { parseArgs } from 'node:util'
import { setTimeout as delay } from 'node:timers/promises'

const { values } = parseArgs({
  options: {
    port: { type: 'string', default: '3100' },
    requests: { type: 'string', default: '100' },
    concurrency: { type: 'string', default: '5' },
    'isolated-fixture': { type: 'boolean' },
  },
})
const { PERF_SCHEDULE_ID, PERF_ATTEMPT_ID, PERF_ACCESS_TOKEN } = process.env
const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i

function boundedInteger(raw, max, name) {
  const number = Number(raw)
  if (!Number.isInteger(number) || number < 1 || number > max) {
    throw new Error(`${name} must be between 1 and ${max}`)
  }
  return number
}

async function probe(url, token) {
  const startedAt = performance.now()
  let status
  try {
    const response = await fetch(url, {
      headers: { authorization: `Bearer ${token}` },
      redirect: 'manual',
      signal: AbortSignal.timeout(5_000),
    })
    status = response.status
    if (response.ok) {
      const attempt = (await response.json()).data
      if (!['GRADED', 'PUBLISHED'].includes(attempt?.status)) status = 'fixture-not-graded'
    } else {
      await response.arrayBuffer()
    }
  } catch (error) {
    status = error.name === 'TimeoutError' ? 'timeout' : 'connection-error'
  }
  return { status, elapsedMs: performance.now() - startedAt }
}

if (!values['isolated-fixture'] || !uuid.test(PERF_SCHEDULE_ID ?? '') ||
    !uuid.test(PERF_ATTEMPT_ID ?? '') || !PERF_ACCESS_TOKEN) {
  throw new Error('Confirm an isolated test instance and set PERF_SCHEDULE_ID, PERF_ATTEMPT_ID and PERF_ACCESS_TOKEN')
}
const port = boundedInteger(values.port, 65535, 'port')
const requestCount = boundedInteger(values.requests, 10_000, 'requests')
const concurrency = boundedInteger(values.concurrency, Math.min(100, requestCount), 'concurrency')
const url = `http://127.0.0.1:${port}/api/student/exam-schedules/${PERF_SCHEDULE_ID}/attempts/${PERF_ATTEMPT_ID}/status`

for (let i = 0; i < 5; i++) {
  const { status } = await probe(url, PERF_ACCESS_TOKEN)
  if (status !== 200) throw new Error(`Fixture warmup failed (${status})`)
}

const startedAt = performance.now()
const samples = []
let issued = 0
await Promise.all(Array.from({ length: concurrency }, async () => {
  while (issued++ < requestCount) {
    const sample = await probe(url, PERF_ACCESS_TOKEN)
    samples.push(sample)
    if (sample.status === 429) await delay(500)
  }
}))
const elapsedSeconds = (performance.now() - startedAt) / 1000
const statusCounts = {}
for (const { status } of samples) statusCounts[status] = (statusCounts[status] ?? 0) + 1
const successCount = statusCounts[200] ?? 0
const timings = samples.map(({ elapsedMs }) => elapsedMs).sort((a, b) => a - b)
const percentile = (p) => timings[Math.ceil(p * timings.length) - 1]
console.log(JSON.stringify({
  workload: 'attempt-status', requestCount, concurrency, elapsedSeconds, statusCounts,
  completedRps: requestCount / elapsedSeconds, successfulRps: successCount / elapsedSeconds,
  errorRate: (requestCount - successCount) / requestCount,
  meanMs: timings.reduce((sum, time) => sum + time, 0) / timings.length,
  p50Ms: percentile(0.5), p95Ms: percentile(0.95), p99Ms: percentile(0.99),
}))
if (successCount !== requestCount) process.exitCode = 1
