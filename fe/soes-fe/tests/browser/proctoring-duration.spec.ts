import { expect, test } from '@playwright/test'

test('screen-share violation ends when sharing recovers before creation finishes', async ({ page }) => {
  await page.goto('/')
  const endedIds = await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { takeExamApi } = await import('/src/pages/student/api/student-take-exam.api.ts')
    const { useScreenShareViolationMonitor } = await import('/src/pages/student/hooks/take-exam/useScreenShareViolationMonitor.ts')
    const originalRecord = takeExamApi.recordViolation
    const originalEnd = takeExamApi.endViolation
    const ended: string[] = []
    let resolveRecord!: (value: { id: string }) => void
    let recordStarted!: () => void
    const started = new Promise<void>((resolve) => { recordStarted = resolve })
    let violationEnded!: () => void
    const finished = new Promise<void>((resolve) => { violationEnded = resolve })
    Object.assign(takeExamApi, {
      recordViolation: () => { recordStarted(); return new Promise((resolve) => { resolveRecord = resolve }) },
      endViolation: async (_scheduleId: string, _attemptId: string, id: string) => {
        ended.push(id)
        violationEnded()
      },
    })
    const container = document.createElement('div')
    document.body.replaceChildren(container)
    const root = ReactDOM.createRoot(container)
    const Monitor = ({ status }: { status: 'STOPPED' | 'ACTIVE' }) => {
      useScreenShareViolationMonitor({ enabled: true, scheduleId: 'schedule', attemptId: 'attempt', screenShareStatus: status })
      return null
    }
    try {
      root.render(React.createElement(Monitor, { status: 'STOPPED' }))
      await started
      root.render(React.createElement(Monitor, { status: 'ACTIVE' }))
      await new Promise((resolve) => setTimeout(resolve, 50))
      resolveRecord({ id: 'screen-violation' })
      await finished
      return ended
    } finally {
      root.unmount()
      Object.assign(takeExamApi, { recordViolation: originalRecord, endViolation: originalEnd })
    }
  })
  expect(endedIds).toEqual(['screen-violation'])
})
