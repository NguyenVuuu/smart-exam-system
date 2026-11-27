import prisma from '../lib/prisma'
import { logger } from '../lib/logger'

const INTERVAL_MS = 60 * 60 * 1000
let started = false
let timer: NodeJS.Timeout | undefined
let activeRun: Promise<void> | undefined

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
  const tick = () => { activeRun ??= purge().finally(() => { activeRun = undefined }) }
  tick()
  timer = setInterval(tick, INTERVAL_MS)
}

export async function stopFaceReviewImageJobs() {
  if (timer) clearInterval(timer)
  timer = undefined
  started = false
  await activeRun
}
