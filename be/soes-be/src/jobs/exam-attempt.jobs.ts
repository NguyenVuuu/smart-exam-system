import { logger } from '../lib/logger'
import {
  markOfflineExamSessions,
  processExpiredAttempts,
} from '../modules/student-take-exam/services/student-take-exam.service'

const JOB_INTERVAL_MS = 15_000

let started = false
let timer: NodeJS.Timeout | undefined
let activeRun: Promise<void> | undefined

export function startExamAttemptJobs(): void {
  if (started) return
  started = true

  const run = async () => {
    try {
      await Promise.all([
        processExpiredAttempts(),
        markOfflineExamSessions(),
      ])
    } catch (error) {
      logger.error('Exam attempt background jobs failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
  const tick = () => { activeRun ??= run().finally(() => { activeRun = undefined }) }
  timer = setInterval(tick, JOB_INTERVAL_MS)
  tick()
  logger.info('Exam attempt background jobs started', {
    intervalMs: JOB_INTERVAL_MS,
  })
}

export async function stopExamAttemptJobs() {
  if (timer) clearInterval(timer)
  timer = undefined
  started = false
  await activeRun
}
