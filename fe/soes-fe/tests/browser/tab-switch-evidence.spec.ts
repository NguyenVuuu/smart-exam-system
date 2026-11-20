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
    await pause(120)
    const capturedTooEarly = capturedAt !== 0
    await pause(350)
    root.unmount()
    container.remove()
    return { capturedTooEarly, elapsedMs: capturedAt - switchedAt, reports }
  })
  expect(result.capturedTooEarly).toBe(false)
  expect(result.elapsedMs).toBeGreaterThanOrEqual(180)
  expect(result.elapsedMs).toBeLessThan(450)
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
    await pause(350)
    root.unmount()
    return { captures, reports }
  })
  expect(result).toEqual({ captures: 0, reports: [0] })
})

test('a short switch lasting 300 ms can capture the destination screen', async ({ page }) => {
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
        captureScreenEvidence: async () => { captures++; return [new File(['destination'], 'destination.jpg')] },
        onViolation: (payload) => { reports.push(payload.evidenceFiles?.length ?? 0) },
      })
      return null
    }
    const container = document.createElement('div'); document.body.append(container)
    const root = ReactDOM.createRoot(container)
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    root.render(React.createElement(Probe))
    await pause(50)
    visibility = 'hidden'; document.dispatchEvent(new Event('visibilitychange'))
    await pause(300)
    visibility = 'visible'; document.dispatchEvent(new Event('visibilitychange'))
    await pause(100)
    root.unmount(); container.remove()
    return { captures, reports }
  })
  expect(result).toEqual({ captures: 1, reports: [1] })
})

test('a blocked screen capture still records the tab switch', async ({ page }) => {
  await page.goto('/')
  const reports = await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { useExamIntegrityGuard } = await import('/src/pages/student/hooks/take-exam/useExamIntegrityGuard.ts')
    const violations: number[] = []
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
    function Probe() {
      useExamIntegrityGuard({
        enabled: true, enableTabLock: true, blockCopyPaste: false, blockRightClick: false, requireFullscreen: false,
        captureScreenEvidence: () => new Promise(() => undefined),
        onViolation: (payload) => { violations.push(payload.evidenceFiles?.length ?? 0) },
      })
      return null
    }
    const container = document.createElement('div'); document.body.append(container)
    const root = ReactDOM.createRoot(container)
    await new Promise((resolve) => setTimeout(resolve, 50))
    root.render(React.createElement(Probe))
    await new Promise((resolve) => setTimeout(resolve, 50))
    document.dispatchEvent(new Event('visibilitychange'))
    await new Promise((resolve) => setTimeout(resolve, 3100))
    root.unmount(); container.remove()
    return violations
  })
  expect(reports).toEqual([0])
})

test('screen evidence captures a live monitor frame', async ({ page }) => {
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

test('screen evidence uses the newer monitor frame when a hidden tab cannot decode video', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { captureScreenEvidence } = await import('/src/pages/student/hooks/take-exam/useScreenShareViolationMonitor.ts')
    const canvas = document.createElement('canvas')
    canvas.width = 40; canvas.height = 40
    const context = canvas.getContext('2d')!
    const stream = canvas.captureStream(1)
    const track = stream.getVideoTracks()[0]
    track.getSettings = () => ({ displaySurface: 'monitor' })
    const original = Object.getOwnPropertyDescriptor(window, 'ImageCapture')
    let grabs = 0
    Object.defineProperty(window, 'ImageCapture', { configurable: true, value: class {
      async grabFrame() {
        grabs++
        context.fillStyle = grabs === 1 ? '#0000ff' : '#ff0000'
        context.fillRect(0, 0, 40, 40)
        return createImageBitmap(canvas)
      }
    } })
    try {
      const files = await captureScreenEvidence(stream)
      const image = await createImageBitmap(files![0])
      const output = document.createElement('canvas')
      output.width = 40; output.height = 40
      const outputContext = output.getContext('2d')!
      outputContext.drawImage(image, 0, 0)
      const [red, , blue] = outputContext.getImageData(20, 20, 1, 1).data
      image.close()
      return { grabs, count: files?.length, red, blue }
    } finally {
      track.stop()
      if (original) Object.defineProperty(window, 'ImageCapture', original)
      else delete (window as Window & { ImageCapture?: unknown }).ImageCapture
    }
  })
  expect(result.grabs).toBe(2)
  expect(result.count).toBe(1)
  expect(result.red).toBeGreaterThan(220)
  expect(result.blue).toBeLessThan(40)
})
