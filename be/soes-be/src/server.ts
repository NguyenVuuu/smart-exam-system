import 'dotenv/config'
import { createServer } from 'http'
import app from './app'
import { startExamAttemptJobs, stopExamAttemptJobs } from './jobs/exam-attempt.jobs'
import { startExamAnchorJobs, stopExamAnchorJobs } from './jobs/exam-anchor.jobs'
import { logger } from './lib/logger'
import { assertExamEncryptionConfigured } from './lib/encryption'
import { initializeSystemSettings } from './modules/admin-system-settings/services/admin-system-settings.service'
import { initProctoringRealtime, realtimeConnectionCount, stopProctoringRealtime } from './modules/proctoring/proctoring-realtime.gateway'
import { startPerformanceReporting } from './lib/performance'
import { assertFaceVerificationConfigured } from './config'
import { assertFaceImageEncryptionConfigured } from './modules/student-face/services/face-image.crypto'
import { startFaceReviewImageJobs, stopFaceReviewImageJobs } from './jobs/face-review-image.jobs'
import prisma from './lib/prisma'
import redis from './lib/redis'

const PORT = process.env.PORT ?? 3000
const httpServer = createServer(app)
let shuttingDown = false
let stopPerformance: (() => void) | undefined

async function shutdown() {
  if (shuttingDown) return
  shuttingDown = true
  const deadline = setTimeout(() => {
    logger.error('Shutdown deadline exceeded')
    httpServer.closeAllConnections()
    process.exit(1)
  }, 30_000)
  deadline.unref()
  const drained = new Promise<void>(resolve => httpServer.close(() => resolve()))
  let completed = false
  try {
    await Promise.all([stopExamAttemptJobs(), stopExamAnchorJobs(), stopFaceReviewImageJobs()])
    await stopProctoringRealtime()
    await drained
    await prisma.$disconnect()
    completed = true
    logger.info('Server shutdown complete')
  } catch (error) {
    logger.error('Server shutdown failed', { error: String(error) })
    process.exitCode = 1
    httpServer.closeAllConnections()
  } finally {
    stopPerformance?.()
    redis.disconnect()
    if (completed) clearTimeout(deadline)
  }
}

process.once('SIGTERM', () => { void shutdown() })
process.once('SIGINT', () => { void shutdown() })

async function startServer(): Promise<void> {
  assertExamEncryptionConfigured()
  assertFaceVerificationConfigured()
  if (process.env.FACE_VERIFICATION_ENABLED === 'true' && process.env.FACE_VERIFICATION_PROVIDER !== 'mock') {
    assertFaceImageEncryptionConfigured()
  }
  await initializeSystemSettings()
  await initProctoringRealtime(httpServer)
  if (shuttingDown) {
    await stopProctoringRealtime()
    return
  }

  httpServer.listen(PORT, () => {
    stopPerformance = startPerformanceReporting(realtimeConnectionCount)
    startExamAttemptJobs()
    startExamAnchorJobs()
    if (process.env.FACE_VERIFICATION_ENABLED === 'true') startFaceReviewImageJobs()
    logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV })
  })
}

void startServer().catch(async (error: unknown) => {
  logger.error('Unable to start server', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
  await shutdown()
})
