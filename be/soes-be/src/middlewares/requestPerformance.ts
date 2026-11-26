import { randomUUID } from 'node:crypto'
import type { RequestHandler } from 'express'
import { logger } from '../lib/logger'
import { performanceEnabled, withRequestId } from '../lib/performance'

export const requestPerformance: RequestHandler = (req, res, next) => {
  if (!performanceEnabled) return next()
  const requestId = randomUUID()
  const started = performance.now()
  const report = (outcome: 'finished' | 'aborted') => {
    if (process.stdout.writableNeedDrain) return
    const route: unknown = req.route?.path
    const contentLength = req.get('content-length')
    logger.info('HTTP performance', {
      requestId,
      method: req.method,
      route: typeof route === 'string' ? route : 'unmatched',
      status: res.headersSent ? res.statusCode : null,
      outcome,
      elapsedMs: Math.round((performance.now() - started) * 100) / 100,
      declaredRequestBytes: contentLength && /^\d{1,15}$/.test(contentLength) ? Number(contentLength) : undefined,
    })
  }
  res.once('finish', () => report('finished'))
  res.once('close', () => { if (!res.writableFinished) report('aborted') })
  withRequestId(requestId, next)
}
