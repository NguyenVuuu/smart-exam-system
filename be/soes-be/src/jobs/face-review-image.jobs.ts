import prisma from '../lib/prisma'
import { logger } from '../lib/logger'

const INTERVAL_MS = 60 * 60 * 1000
let started = false

export function startFaceReviewImageJobs(): void {
  if (started) return
  started = true
  const purge = async () => {
    try {
      await prisma.faceReviewCapture.deleteMany({ where: { expiresAt: { lte: new Date() } } })
    } catch (error) {
      logger.error('Expired face review image cleanup failed', { error: error instanceof Error ? error.message : String(error) })
    }
  }
  void purge()
  setInterval(() => { void purge() }, INTERVAL_MS)
}
