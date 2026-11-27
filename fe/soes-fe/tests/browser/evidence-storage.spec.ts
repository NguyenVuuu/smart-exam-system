import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/tests/browser/fixtures/evidence-storage.html')
})

test('encrypted evidence survives reload with exact bytes, metadata and attempt isolation', async ({ page }) => {
  await page.evaluate(async () => {
    const { openPhoneEvidenceStorage } = await import('/src/utils/phone-evidence-storage.ts')
    const storage = await openPhoneEvidenceStorage('owner', 'schedule', 'attempt')
    await storage.put({ id: 'frame', blob: new Blob(['original-frame'], { type: 'image/jpeg' }), metadata: {
      model: 'yolo11n', category: 'cell phone', confidence: 0.8,
      boundingBox: { originX: 1, originY: 2, width: 3, height: 4 }, frameWidth: 640, frameHeight: 480,
      capturedAt: '2026-11-27T01:00:00Z', observedDurationMs: 0,
    } })
  })
  const encrypted = await page.evaluate(async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('soes-pending-evidence', 1)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    const record = await new Promise<{ ciphertext: ArrayBuffer; blob?: Blob }>((resolve, reject) => {
      const request = database.transaction('phone').objectStore('phone').get('frame')
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
    database.close()
    return { hasPlainBlob: Boolean(record.blob), containsPlaintext: new TextDecoder().decode(record.ciphertext).includes('original-frame') }
  })
  expect(encrypted).toEqual({ hasPlainBlob: false, containsPlaintext: false })
  await page.reload()
  const restored = await page.evaluate(async () => {
    const { openPhoneEvidenceStorage } = await import('/src/utils/phone-evidence-storage.ts')
    const storage = await openPhoneEvidenceStorage('owner', 'schedule', 'attempt')
    const [frame] = await storage.load()
    const otherOwner = await openPhoneEvidenceStorage('different', 'schedule', 'attempt')
    const otherAttempt = await openPhoneEvidenceStorage('owner', 'schedule', 'other')
    const isolated = (await otherOwner.load()).length + (await otherAttempt.load()).length
    const bytes = await frame.blob.text()
    const timestamp = frame.metadata.capturedAt
    await storage.remove(frame.id)
    return { bytes, timestamp, isolated, afterAck: (await storage.load()).length }
  })
  expect(restored).toEqual({ bytes: 'original-frame', timestamp: '2026-11-27T01:00:00Z', isolated: 0, afterAck: 0 })
})

test('capacity is bounded, expired images are deleted, logout invalidates existing storage', async ({ page }) => {
  const observed = await page.evaluate(async () => {
    const { openPhoneEvidenceStorage, clearPhoneEvidenceSessions } = await import('/src/utils/phone-evidence-storage.ts')
    const storage = await openPhoneEvidenceStorage('owner', 'schedule', 'attempt')
    const metadata = {
      model: 'yolo11n' as const, category: 'cell phone' as const, confidence: 0.8,
      boundingBox: { originX: 1, originY: 2, width: 3, height: 4 }, frameWidth: 640, frameHeight: 480,
      capturedAt: new Date().toISOString(), observedDurationMs: 0,
    }
    for (let index = 0; index < 20; index++) await storage.put({ id: `frame-${index}`, blob: new Blob(['frame']), metadata })
    let overflowRejected = false
    try { await storage.put({ id: 'overflow', blob: new Blob(['frame']), metadata }) }
    catch { overflowRejected = true }
    const capacity = (await storage.load()).length
    const originalNow = Date.now
    Date.now = () => originalNow() + 31 * 60_000
    const expired = (await storage.load()).length
    Date.now = originalNow
    await storage.put({ id: 'logout', blob: new Blob(['private-frame']), metadata })
    await clearPhoneEvidenceSessions()
    let oldSessionRejected = false
    try { await storage.load() } catch { oldSessionRejected = true }
    const fresh = await openPhoneEvidenceStorage('owner', 'schedule', 'attempt')
    return { overflowRejected, capacity, expired, oldSessionRejected, remaining: (await fresh.load()).length }
  })
  expect(observed).toEqual({ overflowRejected: true, capacity: 20, expired: 0, oldSessionRejected: true, remaining: 0 })
})

test('simultaneous storage opens share a session and byte limit rejects oversized evidence', async ({ page }) => {
  const observed = await page.evaluate(async () => {
    const { openPhoneEvidenceStorage } = await import('/src/utils/phone-evidence-storage.ts')
    const [first, second] = await Promise.all([openPhoneEvidenceStorage('owner', 'schedule', 'attempt'),
      openPhoneEvidenceStorage('owner', 'schedule', 'attempt')])
    const metadata = { model: 'yolo11n' as const, category: 'cell phone' as const, confidence: 0.8,
      boundingBox: { originX: 1, originY: 2, width: 3, height: 4 }, frameWidth: 640, frameHeight: 480,
      capturedAt: new Date().toISOString(), observedDurationMs: 0 }
    await first.put({ id: 'shared', blob: new Blob(['frame']), metadata })
    let oversizedRejected = false
    try { await second.put({ id: 'oversized', blob: new Blob([new Uint8Array(12 * 1024 * 1024 + 1)]), metadata }) }
    catch { oversizedRejected = true }
    return { oversizedRejected, restored: (await second.load()).length }
  })
  expect(observed).toEqual({ oversizedRejected: true, restored: 1 })
})

test('phone upload retries the original frame after a failed request and page reload', async ({ page }) => {
  await page.addInitScript(() => {
    class FixtureWorker {
      onmessage: ((event: MessageEvent) => void) | null = null
      onerror = null
      postMessage(message: { type: string }) {
        if (message.type !== 'init') return
        setTimeout(() => {
          this.onmessage?.(new MessageEvent('message', { data: { type: 'ready' } }))
          if (sessionStorage.getItem('fixture:capture')) return
          sessionStorage.setItem('fixture:capture', '1')
          this.onmessage?.(new MessageEvent('message', { data: { type: 'result', evidence: {
            blob: new Blob(['exact-captured-frame'], { type: 'image/jpeg' }), metadata: {
              model: 'yolo11n', category: 'cell phone', confidence: 0.8,
              boundingBox: { originX: 1, originY: 2, width: 3, height: 4 }, frameWidth: 32, frameHeight: 24,
              capturedAt: new Date().toISOString(), observedDurationMs: 0,
            },
          } } }))
        }, 0)
      }
      terminate() {}
    }
    Object.defineProperty(window, 'Worker', { value: FixtureWorker })
  })
  const requests: string[] = []
  let recover = false
  await page.route(url => url.pathname.startsWith('/api/'), async route => {
    const headers = { 'access-control-allow-origin': route.request().headers().origin ?? '*',
      'access-control-allow-credentials': 'true', 'access-control-allow-methods': 'POST, OPTIONS',
      'access-control-allow-headers': 'authorization, content-type' }
    if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
    if (!route.request().url().endsWith('/violations')) return route.abort()
    requests.push(route.request().postData() ?? '')
    return route.fulfill({ status: recover ? 200 : 503, headers, json: { data: { id: 'saved' } } })
  })
  await page.goto('/tests/browser/fixtures/phone-queue.html')
  await expect(page.getByLabel('queue-status')).toContainText('Ảnh bằng chứng chưa gửi được')
  recover = true
  await page.reload()
  await expect.poll(() => requests.length).toBeGreaterThanOrEqual(2)
  const metadata = (body: string) => body.match(/name="metadata"\r\n\r\n([^\r]+)/)?.[1]
  expect(metadata(requests[0])).toBeTruthy()
  expect(metadata(requests.at(-1)!)).toBe(metadata(requests[0]))
  expect(requests.every(body => body.includes('exact-captured-frame'))).toBe(true)
  await expect.poll(async () => page.evaluate(async () => {
    const { openPhoneEvidenceStorage } = await import('/src/utils/phone-evidence-storage.ts')
    return (await (await openPhoneEvidenceStorage('fixture-owner', 'fixture-schedule', 'fixture-attempt')).load()).length
  })).toBe(0)
})
