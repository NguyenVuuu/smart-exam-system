import 'dotenv/config'
import { createServer } from 'http'
import app from './app'
import { startExamAttemptJobs } from './jobs/exam-attempt.jobs'
import { startExamAnchorJobs } from './jobs/exam-anchor.jobs'
import { logger } from './lib/logger'
import { assertExamEncryptionConfigured } from './lib/encryption'
import { initializeSystemSettings } from './modules/admin-system-settings/services/admin-system-settings.service'
import { initProctoringRealtime } from './modules/proctoring/proctoring-realtime.gateway'
import { assertFaceVerificationConfigured } from './config'
import { assertFaceImageEncryptionConfigured } from './modules/student-face/services/face-image.crypto'
import { startFaceReviewImageJobs } from './jobs/face-review-image.jobs'

const PORT = process.env.PORT ?? 3000
const httpServer = createServer(app)

async function startServer(): Promise<void> {
  assertExamEncryptionConfigured()
  assertFaceVerificationConfigured()
  if (process.env.FACE_VERIFICATION_ENABLED === 'true' && process.env.FACE_VERIFICATION_PROVIDER !== 'mock') {
    assertFaceImageEncryptionConfigured()
  }
  await initializeSystemSettings()
  void initProctoringRealtime(httpServer)

  httpServer.listen(PORT, () => {
    startExamAttemptJobs()
    startExamAnchorJobs()
    if (process.env.FACE_VERIFICATION_ENABLED === 'true') startFaceReviewImageJobs()
    logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV })
  })
}

void startServer().catch((error: unknown) => {
  logger.error('Unable to start server', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
})
