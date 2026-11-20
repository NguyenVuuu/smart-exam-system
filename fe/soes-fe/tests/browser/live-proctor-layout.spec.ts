import { expect, test } from '@playwright/test'

test('proctor actions stay on one row and stream preview expands', async ({ page }) => {
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.goto('/')
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { default: StudentLiveTable } = await import('/src/pages/teacher/components/proctoring/StudentLiveTable.tsx')
    const { default: LiveStreamPanel } = await import('/src/pages/teacher/components/proctoring/LiveStreamPanel.tsx')
    const session = {
      attemptId: 'attempt-1', studentName: 'Trần Thị C', studentCode: 'US000007',
      attemptStatus: 'IN_PROGRESS', endedBy: null, isOnline: true,
      webcamStatus: 'ACTIVE', screenShareStatus: 'ACTIVE', visionStatus: 'ACTIVE',
      answeredCount: 1, totalQuestionCount: 5, violationCount: 2,
    }
    const container = document.createElement('div')
    container.className = 'grid min-w-0 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_280px] xl:grid-cols-[minmax(0,1fr)_300px]'
    document.body.replaceChildren(container)
    const table = React.createElement(StudentLiveTable, {
      sessions: [session], liveAttemptId: null, liveStreamType: 'WEBCAM',
      onStartLive() {}, onStopLive() {}, onExtendTime() {}, onForceSubmit() {}, onInvalidate() {},
    })
    const panel = React.createElement(LiveStreamPanel, {
      liveStudent: session, liveStatus: 'IDLE', liveSessionId: null,
      liveStreamType: 'WEBCAM', remoteStream: null,
      videoRef: React.createRef(), onCapture() {},
    })
    ReactDOM.createRoot(container).render(React.createElement(React.Fragment, null, table, panel))
  })
  const camera = page.getByRole('button', { name: 'Camera' })
  const screen = page.getByRole('button', { name: 'Màn hình' })
  const actions = page.getByRole('button', { name: 'Xử lý bài thi của Trần Thị C' })
  await expect(camera).toBeVisible()
  const previewBox = await page.locator('section').boundingBox()
  const tableBox = await page.locator('table').boundingBox()
  expect(previewBox!.x).toBeGreaterThan(tableBox!.x)
  expect(previewBox!.y).toBeLessThan(tableBox!.y + tableBox!.height)
  expect(previewBox!.width).toBeLessThanOrEqual(300)
  const [cameraBox, screenBox, actionsBox] = await Promise.all([camera.boundingBox(), screen.boundingBox(), actions.boundingBox()])
  expect(cameraBox?.y).toBe(screenBox?.y)
  expect(Math.abs((cameraBox!.y + cameraBox!.height / 2) - (actionsBox!.y + actionsBox!.height / 2))).toBeLessThan(1)
  await actions.click()
  await expect(page.getByRole('button', { name: 'Buộc nộp' })).toBeVisible()
  await page.getByRole('button', { name: 'Phóng to luồng giám sát' }).click()
  const dialog = page.getByRole('dialog', { name: 'Camera sinh viên' })
  await expect(dialog).toBeVisible()
  expect((await dialog.boundingBox())?.width).toBeGreaterThan(1300)
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
})
