import { logger } from '../lib/logger'
import {
  markOfflineExamSessions,
  processExpiredAttempts,
} from '../modules/student-take-exam/services/student-take-exam.service'

const JOB_INTERVAL_MS = 15_000

let started = false
let running = false

export function startExamAttemptJobs(): void {
  if (started) return
  started = true

  const run = async () => {
    if (running) return
    running = true

    try {
      await Promise.all([
        processExpiredAttempts(),
        markOfflineExamSessions(),
      ])
    } catch (error) {
      logger.error('Exam attempt background jobs failed', {
        error: error instanceof Error ? error.message : String(error),
      })
    } finally {
      running = false
    }
  }

  setInterval(() => {
    void run()
  }, JOB_INTERVAL_MS)

  void run()
  logger.info('Exam attempt background jobs started', {
    intervalMs: JOB_INTERVAL_MS,
  })
}
