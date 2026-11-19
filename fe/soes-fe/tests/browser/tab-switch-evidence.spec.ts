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
