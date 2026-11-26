import assert from 'node:assert/strict'
import Module from 'node:module'
import { test } from 'node:test'

test('grading worker bounds active jobs, preserves statuses and drains before exit', async context => {
  const ids = [
    '../modules/student-take-exam/repositories/grading-job.repository',
    '../modules/student-take-exam/services/programming-grading.service',
    '../modules/student-take-exam/repositories/attempt-grading.repository',
  ].map(path => require.resolve(path))
  const originals = ids.map(id => require.cache[id])
  const workerId = require.resolve('./attempt-grading.jobs')
  const claims = ['STUDENT', 'PROCTOR', 'TIMEOUT'].map((endedBy, index) => ({
    id: String(index), gradingClaimToken: `token-${index}`, endedBy, submittedAt: new Date(),
  }))
  const releases: Array<() => void> = []
  const completed: Array<{ id: string; status: unknown }> = []
  const stubs = [
    { claimGradingJob: async () => claims.shift() ?? null, renewGradingClaim: async () => ({ count: 1 }),
      failGradingClaim: async () => { assert.fail('successful jobs must not fail') } },
    { gradeProgrammingAnswers: () => new Promise<void>(resolve => { releases.push(resolve) }) },
    { gradeObjectiveAnswers: async (id: string, options: { claimToken: string; finalStatus?: string }) => {
      assert.equal(options.claimToken, `token-${id}`)
      completed.push({ id, status: options.finalStatus })
    } },
  ]
  ids.forEach((id, index) => { const stub = new Module(id); stub.exports = stubs[index]; require.cache[id] = stub })
  const jobs = await import('./attempt-grading.jobs')
  context.after(async () => {
    releases.forEach(release => release())
    await jobs.stopAttemptGradingJobs()
    ids.forEach((id, index) => {
      if (originals[index]) require.cache[id] = originals[index]
      else delete require.cache[id]
    })
    delete require.cache[workerId]
  })
  await jobs.processGradingJobs()
  assert.equal(releases.length, 2)
  assert.equal(claims.length, 1)
  releases[0]()
  await new Promise(resolve => setImmediate(resolve))
  await jobs.processGradingJobs()
  assert.equal(releases.length, 3)
  releases[1](); releases[2]()
  await jobs.stopAttemptGradingJobs()
  assert.deepEqual(completed, [
    { id: '0', status: undefined }, { id: '1', status: 'GRADING' }, { id: '2', status: 'AUTO_SUBMITTED' },
  ])
})
