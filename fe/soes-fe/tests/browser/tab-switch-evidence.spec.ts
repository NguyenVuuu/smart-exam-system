import { expect, test } from '@playwright/test'

test('tab switch waits for the destination screen frame and records one violation', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { useExamIntegrityGuard } = await import('/src/pages/student/hooks/take-exam/useExamIntegrityGuard.ts')
    const reports: Array<{ description: string; evidenceCount: number; detectedAt: string }> = []
    let capturedAt = 0
    let visibility = 'visible'
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    function Probe() {
      useExamIntegrityGuard({
        enabled: true, enableTabLock: true, blockCopyPaste: false, blockRightClick: false,
        requireFullscreen: false,
        captureScreenEvidence: async () => {
          capturedAt = performance.now()
          return [new File(['screen'], 'evidence.jpg', { type: 'image/jpeg' })]
        },
        onViolation: (payload) => {
          reports.push({ description: payload.description, evidenceCount: payload.evidenceFiles?.length ?? 0, detectedAt: payload.detectedAt })
        },
      })
      return null
    }
    const container = document.createElement('div')
    document.body.append(container)
    const root = ReactDOM.createRoot(container)
    root.render(React.createElement(Probe))
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    await pause(50)
    const switchedAt = performance.now()
    window.dispatchEvent(new Event('blur'))
    visibility = 'hidden'
    document.dispatchEvent(new Event('visibilitychange'))
    await pause(200)
    const capturedTooEarly = capturedAt !== 0
    await pause(500)
    root.unmount()
    container.remove()
    return { capturedTooEarly, elapsedMs: capturedAt - switchedAt, reports }
  })
  expect(result.capturedTooEarly).toBe(false)
  expect(result.elapsedMs).toBeGreaterThanOrEqual(400)
  expect(result.reports).toHaveLength(1)
  expect(result.reports[0].description).toContain('switched away')
  expect(result.reports[0].evidenceCount).toBe(1)
})

test('returning to the exam before capture records the switch without an exam screenshot', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { useExamIntegrityGuard } = await import('/src/pages/student/hooks/take-exam/useExamIntegrityGuard.ts')
    let visibility = 'visible'
    let captures = 0
    const reports: number[] = []
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibility })
    document.hasFocus = () => visibility === 'visible'
    function Probe() {
      useExamIntegrityGuard({
        enabled: true, enableTabLock: true, blockCopyPaste: false, blockRightClick: false, requireFullscreen: false,
        captureScreenEvidence: async () => { captures++; return [new File(['exam'], 'exam.jpg')] },
        onViolation: (payload) => { reports.push(payload.evidenceFiles?.length ?? 0) },
      })
      return null
    }
    const container = document.createElement('div'); document.body.append(container)
    const root = ReactDOM.createRoot(container)
    root.render(React.createElement(Probe))
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    await pause(50)
    visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange'))
    await pause(100)
    visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange'))
    await pause(600)
    root.unmount()
    return { captures, reports }
  })
  expect(result).toEqual({ captures: 0, reports: [0] })
})

test('screen evidence waits for newly decoded frames instead of using grabFrame', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { captureScreenEvidence } = await import('/src/pages/student/hooks/take-exam/useScreenShareViolationMonitor.ts')
    const canvas = document.createElement('canvas')
    canvas.width = 320; canvas.height = 240
    const ctx = canvas.getContext('2d')!
    const timer = setInterval(() => { ctx.fillStyle = 'blue'; ctx.fillRect(0, 0, 320, 240) }, 30)
    const stream = canvas.captureStream(30)
    const track = stream.getVideoTracks()[0]
    track.getSettings = () => ({ displaySurface: 'monitor' })
    try {
      const files = await captureScreenEvidence(stream)
      return { count: files?.length, type: files?.[0].type }
    } finally { clearInterval(timer); track.stop() }
  })
  expect(result).toEqual({ count: 1, type: 'image/jpeg' })
})
