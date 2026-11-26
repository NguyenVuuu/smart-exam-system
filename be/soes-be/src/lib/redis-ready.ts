import type { EventEmitter } from 'node:events'

export function waitForRedisReady(client: EventEmitter & { status: string }, timeoutMs = 10_000) {
  if (client.status === 'ready') return Promise.resolve()
  return new Promise<void>((resolve, reject) => {
    const finish = (error?: Error) => {
      clearTimeout(timer)
      client.off('ready', ready)
      client.off('error', failed)
      client.off('end', ended)
      if (error) reject(error)
      else resolve()
    }
    const ready = () => finish()
    const failed = (error: Error) => finish(error)
    const ended = () => finish(new Error('Redis connection ended before readiness'))
    const timer = setTimeout(() => finish(new Error('Redis adapter readiness timed out')), timeoutMs)
    client.once('ready', ready)
    client.once('error', failed)
    client.once('end', ended)
    if (client.status === 'end') ended()
  })
}
