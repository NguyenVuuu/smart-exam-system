import prisma from '../lib/prisma'
import { isBlockchainConfigured } from '../lib/blockchain'
import { logger } from '../lib/logger'
import { anchorPublishedExam } from '../modules/teacher-exams/services/exam-blockchain.service'

const INTERVAL_MS = 60_000
const BATCH_SIZE = 10
let started = false
let running = false

export async function retryPendingExamAnchors(): Promise<void> {
  if (running || !isBlockchainConfigured()) return
  running = true
  try {
    const exams = await prisma.exam.findMany({
      where: { status: 'READY', blockchainAnchoredAt: null },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
      take: BATCH_SIZE,
    })
    for (const exam of exams) await anchorPublishedExam(exam.id)
  } catch (error) {
    logger.error('Pending exam anchor retry failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  } finally {
    running = false
  }
}

export function startExamAnchorJobs(): void {
  if (started) return
  started = true
  setInterval(() => { void retryPendingExamAnchors() }, INTERVAL_MS)
  void retryPendingExamAnchors()
  logger.info('Pending exam anchor retry started', { intervalMs: INTERVAL_MS })
}
