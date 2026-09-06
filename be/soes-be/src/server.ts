import 'dotenv/config'
import { createServer } from 'http'
import app from './app'
import { startExamAttemptJobs } from './jobs/exam-attempt.jobs'
import { logger } from './lib/logger'
import { initProctoringRealtime } from './modules/proctoring/proctoring-realtime.gateway'

const PORT = process.env.PORT ?? 3000
const httpServer = createServer(app)

void initProctoringRealtime(httpServer)

httpServer.listen(PORT, () => {
  startExamAttemptJobs()
  logger.info(`Server running on port ${PORT}`, { port: PORT, env: process.env.NODE_ENV })
})
