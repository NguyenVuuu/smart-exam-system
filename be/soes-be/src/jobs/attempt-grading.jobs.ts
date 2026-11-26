import { logger } from '../lib/logger'
import { performanceEnabled } from '../lib/performance'
import * as jobs from '../modules/student-take-exam/repositories/grading-job.repository'
import { gradeProgrammingAnswers } from '../modules/student-take-exam/services/programming-grading.service'
import { gradeObjectiveAnswers } from '../modules/student-take-exam/repositories/attempt-grading.repository'

const MAX_ACTIVE = 2
let claimPass: Promise<void> | undefined
let stopping = false
let timer: NodeJS.Timeout | undefined
const pending = new Set<Promise<void>>()

async function grade(claim: jobs.GradingClaim) {
  const startedAt = performance.now()
  const queueWaitMs = claim.submittedAt ? Math.max(0, Date.now() - claim.submittedAt.getTime()) : undefined
  let completed = false
  let renewing = false
  const lease = setInterval(() => {
    if (renewing) return
    renewing = true
    void jobs.renewGradingClaim(claim).catch(error => {
      logger.warn('Could not renew grading lease', { attemptId: claim.id, error: String(error) })
    }).finally(() => { renewing = false })
  }, 30_000)
  lease.unref()
  try {
    await gradeProgrammingAnswers(claim.id, claim.gradingClaimToken)
    const finalStatus = claim.endedBy === 'TIMEOUT' ? 'AUTO_SUBMITTED'
      : claim.endedBy === 'PROCTOR' ? 'GRADING' : undefined
    await gradeObjectiveAnswers(claim.id, { finalStatus, claimToken: claim.gradingClaimToken })
    completed = true
  } catch (error) {
    await jobs.failGradingClaim(claim)
    logger.error('Background grading deferred for retry', { attemptId: claim.id, error: String(error) })
  } finally {
    clearInterval(lease)
    if (performanceEnabled && !process.stdout.writableNeedDrain) {
      logger.info('Grading job performance', {
        attemptId: claim.id, completed, elapsedMs: Math.round(performance.now() - startedAt), queueWaitMs,
      })
    }
  }
}

async function claimAvailableJobs() {
  while (!stopping && pending.size < MAX_ACTIVE) {
    const claim = await jobs.claimGradingJob()
    if (!claim) break
    const task = grade(claim).catch(error => {
      logger.error('Background grading failed', { attemptId: claim.id, error: String(error) })
    }).finally(() => {
      pending.delete(task)
      if (!stopping) schedulePass()
    })
    pending.add(task)
  }
}

function schedulePass() {
  void processGradingJobs().catch(error => logger.error('Grading claim failed', { error: String(error) }))
}

export function processGradingJobs() {
  if (stopping) return Promise.resolve()
  claimPass ??= claimAvailableJobs().finally(() => { claimPass = undefined })
  return claimPass
}

export function startAttemptGradingJobs() {
  if (timer) return
  stopping = false
  timer = setInterval(schedulePass, 5_000)
  timer.unref()
  schedulePass()
}

export async function stopAttemptGradingJobs() {
  stopping = true
  if (timer) clearInterval(timer)
  timer = undefined
  await claimPass?.catch(() => undefined)
  await Promise.allSettled([...pending])
}
