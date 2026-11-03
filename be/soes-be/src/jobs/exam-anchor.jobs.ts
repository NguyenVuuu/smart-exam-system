import prisma from '../lib/prisma'
import { isBlockchainConfigured } from '../lib/blockchain'
import { logger } from '../lib/logger'
import { anchorPublishedExam } from '../modules/teacher-exams/services/exam-blockchain.service'

const INTERVAL_MS = 60_000
const BATCH_SIZE = 10
let started = false
let running = false
let lastProcessedId: string | null = null

export async function retryPendingExamAnchors(): Promise<void> {
  if (running || !isBlockchainConfigured()) return
  running = true
  try {
    const pending = { status: 'READY' as const, anchorRequestedAt: { not: null }, blockchainAnchoredAt: null }
    let exams = await prisma.exam.findMany({
      where: { ...pending, ...(lastProcessedId ? { id: { gt: lastProcessedId } } : {}) },
      select: { id: true },
      orderBy: { id: 'asc' },
      take: BATCH_SIZE,
    })
    if (!exams.length && lastProcessedId) {
      lastProcessedId = null
      exams = await prisma.exam.findMany({
        where: pending, select: { id: true }, orderBy: { id: 'asc' }, take: BATCH_SIZE,
      })
    }
    for (const exam of exams) {
      lastProcessedId = exam.id
      await anchorPublishedExam(exam.id)
    }
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
