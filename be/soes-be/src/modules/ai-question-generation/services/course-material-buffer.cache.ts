const maxBytes = 32 * 1024 * 1024
const maxEntries = 8
const ttlMs = 10 * 60 * 1000

const entries = new Map<string, { buffer: Buffer; expiresAt: number }>()
let bytes = 0

function remove(key: string) {
  const entry = entries.get(key)
  if (!entry) return
  entries.delete(key)
  bytes -= entry.buffer.length
}

function expire(now: number) {
  for (const [key, entry] of entries) if (entry.expiresAt <= now) remove(key)
}

export async function loadCourseMaterialBuffer(
  storagePath: string,
  checksum: string | null,
  download: () => Promise<Buffer>,
): Promise<Buffer> {
  if (!checksum) return download()
  const key = `${storagePath}:${checksum}`
  const now = Date.now()
  expire(now)
  const hit = entries.get(key)
  if (hit) {
    entries.delete(key)
    entries.set(key, hit)
    return hit.buffer
  }

  const buffer = await download()
  if (buffer.length > maxBytes) return buffer
  remove(key)
  while (entries.size >= maxEntries || bytes + buffer.length > maxBytes) {
    remove(entries.keys().next().value!)
  }
  entries.set(key, { buffer, expiresAt: Date.now() + ttlMs })
  bytes += buffer.length
  return buffer
}
