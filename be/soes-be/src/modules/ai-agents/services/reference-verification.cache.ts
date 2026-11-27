import { createHash } from 'node:crypto'
import { judge0Config } from '../../../config'

const verified = new Map<string, number>()
const inFlight = new Map<string, Promise<boolean>>()
const MAX_ENTRIES = 128
const TTL_MS = 5 * 60_000

export async function verifyReferenceOnce(question: unknown, verify: () => Promise<boolean>) {
  const key = createHash('sha256').update(JSON.stringify({
    question, endpoint: judge0Config.baseUrl, cpuTime: 2, memory: 128000,
  })).digest('hex')
  const now = Date.now()
  for (const [entry, expiry] of verified) if (expiry <= now) verified.delete(entry)
  if ((verified.get(key) ?? 0) > now) return true
  const pending = inFlight.get(key)
  if (pending) return pending
  if (inFlight.size >= MAX_ENTRIES) return verify()
  const verification = Promise.resolve().then(verify).then(passed => {
    if (passed) {
      if (verified.size >= MAX_ENTRIES) verified.delete(verified.keys().next().value!)
      verified.set(key, Date.now() + TTL_MS)
    }
    return passed
  })
  inFlight.set(key, verification)
  try { return await verification }
  finally { inFlight.delete(key) }
}
