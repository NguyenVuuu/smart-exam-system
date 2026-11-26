import { AsyncLocalStorage } from 'node:async_hooks'
import { monitorEventLoopDelay } from 'node:perf_hooks'
import { logger } from './logger'

const requestIds = new AsyncLocalStorage<string>()
export const performanceEnabled = process.env.PERFORMANCE_LOGGING === 'true'
export const currentRequestId = () => requestIds.getStore()
export const withRequestId = (id: string, next: () => void) => requestIds.run(id, next)

let queryCount = 0
let queryDurationMs = 0

export function recordDatabaseQuery(durationMs: number) {
  queryCount++
  queryDurationMs += durationMs
}

export function startPerformanceReporting(connectionCount: () => number | undefined) {
  if (!performanceEnabled) return
  const eventLoop = monitorEventLoopDelay({ resolution: 20 })
  eventLoop.enable()
  setInterval(() => {
    logger.info('Runtime performance', {
      eventLoopP99Ms: eventLoop.percentile(99) / 1e6,
      ...process.memoryUsage(),
      databaseQueries: queryCount,
      databaseQueryDurationMs: queryDurationMs,
      realtimeConnections: connectionCount(),
    })
    eventLoop.reset()
    queryCount = 0
    queryDurationMs = 0
  }, 30_000).unref()
}
