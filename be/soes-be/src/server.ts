import 'dotenv/config'
import { createServer } from 'http'
import app from './app'
import { startExamAttemptJobs } from './jobs/exam-attempt.jobs'
import { logger } from './lib/logger'
import { initializeSystemSettings } from './modules/admin-system-settings/services/admin-system-settings.service'
import { initProctoringRealtime } from './modules/proctoring/proctoring-realtime.gateway'

const PORT = process.env.PORT ?? 3000
const httpServer = createServer(app)

async function startServer(): Promise<void> {
  await initializeSystemSettings()
  void initProctoringRealtime(httpServer)

  httpServer.listen(PORT, () => {
    startExamAttemptJobs()
    logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV })
  })
}

void startServer().catch((error: unknown) => {
  logger.error('Unable to start server', {
    error: error instanceof Error ? error.message : String(error),
  })
  process.exitCode = 1
})
