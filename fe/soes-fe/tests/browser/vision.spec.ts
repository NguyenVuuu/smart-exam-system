import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import type { PhoneDetectionMetadata } from '../../src/pages/student/api/student-take-exam.api'

for (const fallback of [false, true]) {
  test(`phone evidence from reference photo (${fallback ? 'CPU fallback' : 'GPU preferred'})`, async ({ page }) => {
    test.skip(!process.env.VISION_TEST_IMAGE, 'Set VISION_TEST_IMAGE to a local phone reference image; private evidence is not committed.')
    const photo = await readFile(process.env.VISION_TEST_IMAGE!)
    await page.route('**/vision-reference.jpg', route => route.fulfill({ contentType: 'image/jpeg', body: photo }))
    if (process.env.VISION_TEST_MODEL) {
      const model = await readFile(process.env.VISION_TEST_MODEL)
      await page.route('**/models/yolo11n-devices.onnx*', route => route.fulfill({ contentType: 'application/octet-stream', body: model }))
    }
    await page.route('**/vision-reference-test', route => route.fulfill({ contentType: 'text/html', body: '<html><body></body></html>' }))
    if (fallback) {
      await page.route('**/mediapipe/vision-worker.js', async route => {
        const response = await route.fetch()
        await route.fulfill({ response, body: (await response.text()).replace(
          'async function createFaceTask(delegate) {',
          "async function createFaceTask(delegate) { if (delegate === 'GPU') throw new Error('Test GPU failure');",
        ) })
      })
    }
    if (process.env.VISION_TEST_CROP) {
      await page.addInitScript((crop) => { (window as Window & { visionTestCrop?: number[] }).visionTestCrop = crop },
        process.env.VISION_TEST_CROP.split(',').map(Number))
    }
    await page.goto('/vision-reference-test')
    const result = await page.evaluate(async (frameCount) => {
      const image = new Image(); image.src = '/vision-reference.jpg'; await image.decode()
      const crop = (window as Window & { visionTestCrop?: number[] }).visionTestCrop
      const canvas = crop ? document.createElement('canvas') : null
      if (canvas && crop) {
        canvas.width = crop[2]; canvas.height = crop[3]
        canvas.getContext('2d')!.drawImage(image, crop[0], crop[1], crop[2], crop[3], 0, 0, crop[2], crop[3])
      }
      const source = canvas ?? image
      const worker = new Worker('/mediapipe/vision-worker.js')
      const next = () => new Promise<{
        type: string; message?: string; kind?: string; diagnostics?: unknown; inferenceMs?: number
        evidence?: { blob: Blob; metadata: PhoneDetectionMetadata }
      }>((resolve, reject) => {
        worker.onmessage = ({ data }) => data.type === 'error' ? reject(new Error(data.message)) : resolve(data)
        worker.onerror = event => reject(new Error(event.message))
      })
      try {
        const ready = next(); worker.postMessage({ type: 'init', mode: 'phone', debug: true }); await ready
        const events = [], samples = []
        for (let i = 0; i < frameCount; i++) {
          const frame = await createImageBitmap(source)
          const pending = next()
          worker.postMessage({ type: 'frame', frame, timestamp: 1000 + i * 250, capturedAt: Date.now() }, [frame])
          const message = await pending
          if (message.kind === 'phone') samples.push({ diagnostics: message.diagnostics, inferenceMs: message.inferenceMs })
          if (message.evidence) {
            const bitmap = await createImageBitmap(message.evidence.blob)
            events.push({ metadata: message.evidence.metadata, width: bitmap.width, height: bitmap.height, mime: message.evidence.blob.type })
            bitmap.close()
          }
        }
        return { events, samples, width: canvas?.width ?? image.naturalWidth, height: canvas?.height ?? image.naturalHeight }
      } finally { worker.terminate() }
    }, Number(process.env.VISION_TEST_FRAMES ?? 18))
    console.log(JSON.stringify({ fallback, samples: result.samples, events: result.events }))
    if (process.env.VISION_TEST_EXPECT_NONE === '1') {
      expect(result.events).toHaveLength(0)
      return
    }
    expect(result.events).toHaveLength(1)
    const event = result.events[0]
    expect(event.metadata.confidence).toBeGreaterThanOrEqual(0.3)
    expect(event.metadata.observedDurationMs).toBe(0)
    expect(event.width).toBe(result.width)
    expect(event.height).toBe(result.height)
    expect(event.mime).toBe('image/jpeg')
    const box = event.metadata.boundingBox
    expect(box.originX).toBeGreaterThanOrEqual(0)
    expect(box.originY).toBeGreaterThanOrEqual(0)
    expect(box.originX + box.width).toBeLessThanOrEqual(result.width)
    expect(box.originY + box.height).toBeLessThanOrEqual(result.height)
  })
}

for (const fallback of [false, true]) {
  test(`real worker loads MediaPipe face model and YOLO phone model (${fallback ? 'CPU fallback' : 'GPU preferred'})`, async ({ page }) => {
    if (fallback) {
      await page.route('**/mediapipe/vision-worker.js', async (route) => {
        const response = await route.fetch()
        await route.fulfill({ response, body: (await response.text()).replace(
          'async function createFaceTask(delegate) {',
          "async function createFaceTask(delegate) { if (delegate === 'GPU') throw new Error('Test GPU failure');",
        ) })
      })
    }
    await page.goto('/')
    const result = await page.evaluate(async () => {
      const run = async (mode: 'face' | 'phone') => {
        const worker = new Worker('/mediapipe/vision-worker.js')
        try {
          const next = () => new Promise<Record<string, unknown>>((resolve, reject) => {
            worker.onmessage = ({ data }) => data.type === 'error' ? reject(new Error(data.message)) : resolve(data)
            worker.onerror = (event) => reject(new Error(event.message))
          })
          const readyPromise = next()
          worker.postMessage({ type: 'init', mode })
          const ready = await readyPromise
          const canvas = document.createElement('canvas')
          canvas.width = 640; canvas.height = 480
          canvas.getContext('2d')!.fillRect(0, 0, 640, 480)
          const frame = await createImageBitmap(canvas)
          const pending = next()
          worker.postMessage({ type: 'frame', frame, timestamp: performance.now(), capturedAt: Date.now() }, [frame])
          return { ready, result: await pending }
        } finally { worker.terminate() }
      }
      const [face, phone] = await Promise.all([run('face'), run('phone')])
      return { face, phone }
    })
    expect(result.face.ready.type).toBe('ready')
    expect(result.phone.ready.type).toBe('ready')
    expect(result.face.result.kind).toBe('face')
    expect(result.phone.result.kind).toBe('phone')
    expect(result.face.result.issue).toBeNull()
    expect(result.phone.result.evidence).toBeNull()
    if (fallback) {
      expect(result.face.ready.faceDelegate).toBe('CPU')
    }
    expect(result.phone.ready.phoneDelegate).toBe('WASM')
  })
}

test('concurrent camera requests share one getUserMedia call and stream', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const webcam = await import('/src/pages/student/utils/exam-webcam.ts')
    const canvas = document.createElement('canvas')
    canvas.width = 640; canvas.height = 480
    const context = canvas.getContext('2d')!
    const timer = setInterval(() => { context.fillRect(0, 0, 640, 480) }, 30)
    let calls = 0
    navigator.mediaDevices.getUserMedia = async () => { calls++; return canvas.captureStream(30) }
    try {
      const streams = await Promise.all([webcam.requestExamWebcam(), webcam.requestExamWebcam(), webcam.requestExamWebcam()])
      return { calls, same: streams.every((stream) => stream === streams[0]) }
    } finally { webcam.stopExamWebcam(); clearInterval(timer) }
  })
  expect(result).toEqual({ calls: 1, same: true })
})

test('teacher log shows phone as pending review and opens evidence on desktop/mobile', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { default: Table } = await import('/src/pages/teacher/components/proctoring/ViolationLogTable.tsx')
    const container = document.createElement('div')
    document.body.replaceChildren(container)
    ReactDOM.createRoot(container).render(React.createElement(Table, {
      violations: [{
        id: 'phone-test', type: 'PHONE_DETECTED', studentName: 'Test Student', studentCode: 'TEST001',
        timestamp: new Date().toISOString(), endedAt: new Date().toISOString(), durationSeconds: 0,
        severity: 'MEDIUM', reviewStatus: 'PENDING', metadata: { confidence: 0.85 },
        evidenceImageUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="240"><rect width="320" height="240" fill="white"/><rect x="100" y="30" width="80" height="160" fill="black"/></svg>',
      }],
      onViewEvidence: (url: string) => {
        const image = document.createElement('img'); image.src = url; image.alt = 'Test evidence'; container.append(image)
      },
    }))
  })
  await expect(page.getByText('Phát hiện điện thoại')).toBeVisible()
  await expect(page.getByText('0s')).toBeVisible()
  await expect(page.getByText(/Cần giảng viên xem xét/)).toBeVisible()
  await expect(page.getByText('Chưa xem')).toBeVisible()
  await page.getByRole('button', { name: 'Xem ảnh' }).click()
  await expect(page.getByAltText('Test evidence')).toBeVisible()
  await page.screenshot({ path: 'test-results/phone-log-desktop.png', fullPage: true })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: 'test-results/phone-log-mobile.png', fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('monitor queues two phone appearances during a slow upload and leaves shared stream alive', async ({ page }) => {
  await page.goto('/')
  const result = await page.evaluate(async () => {
    const { default: React } = await import('/node_modules/.vite/deps/react.js')
    const { default: ReactDOM } = await import('/node_modules/.vite/deps/react-dom_client.js')
    const { useWebcamViolationMonitor } = await import('/src/pages/student/hooks/take-exam/useWebcamViolationMonitor.ts')
    const { takeExamApi } = await import('/src/pages/student/api/student-take-exam.api.ts')
    const canvas = document.createElement('canvas')
    canvas.width = 640; canvas.height = 480
    const timer = setInterval(() => canvas.getContext('2d')!.fillRect(0, 0, 640, 480), 30)
    const stream = canvas.captureStream(30)
    const workers: Array<{ terminated: boolean; frames: number; mode: string }> = []
    const uploads: Array<{ evidenceFiles: File[]; metadata: { confidence: number }; violationType: string }> = []
    let pending = 0, maxPending = 0, cameraRequests = 0
    navigator.mediaDevices.getUserMedia = async () => { cameraRequests++; return stream }
    const originalWorker = window.Worker
    class MockWorker {
      onmessage: ((event: { data: unknown }) => void) | null = null
      terminated = false
      frames = 0
      mode = ''
      constructor() { workers.push(this) }
      terminate() { this.terminated = true }
      postMessage(data: { type: string; mode?: string; frame?: ImageBitmap }) {
        if (data.type === 'init') {
          this.mode = data.mode ?? ''
          setTimeout(() => this.onmessage?.({ data: { type: 'ready' } }), 0)
          return
        }
        if (data.type !== 'frame') return
        this.frames++; const frameNumber = this.frames; pending++; maxPending = Math.max(maxPending, pending)
        data.frame?.close()
        setTimeout(() => {
          pending--
          if (this.terminated) return
          this.onmessage?.({ data: {
            type: 'result', kind: this.mode, issue: null, intervalMs: 250,
            evidence: this.mode === 'phone' && frameNumber <= 2 ? {
              blob: new Blob(['jpeg'], { type: 'image/jpeg' }),
              metadata: { capturedAt: new Date().toISOString(), confidence: 0.9 },
            } : null,
          } })
        }, 300)
      }
    }
    window.Worker = MockWorker as unknown as typeof Worker
    takeExamApi.recordViolation = async (_schedule: string, _attempt: string, payload: typeof uploads[number]) => {
      await new Promise((resolve) => setTimeout(resolve, 600))
      uploads.push(payload)
      return { id: 'phone-event' }
    }
    function Monitor({ enabled }: { enabled: boolean }) {
      useWebcamViolationMonitor({ enabled, scheduleId: 'test-schedule', attemptId: 'test-attempt', stream, webcamStatus: 'ACTIVE' })
      return null
    }
    const container = document.createElement('div'); document.body.append(container)
    const root = ReactDOM.createRoot(container)
    const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))
    try {
      root.render(React.createElement(Monitor, { enabled: false })); await pause(350)
      const beforeStart = workers.length
      root.render(React.createElement(Monitor, { enabled: true })); await pause(2000)
      root.render(React.createElement(Monitor, { enabled: false })); await pause(350)
      const framesAfterStop = workers.map((worker) => worker.frames)
      await pause(600)
      return {
        beforeStart, workerModes: workers.map((worker) => worker.mode),
        terminated: workers.every((worker) => worker.terminated),
        noFramesAfterStop: framesAfterStop.every((count, index) => count === workers[index].frames), cameraRequests,
        streamLive: stream.getVideoTracks()[0].readyState === 'live', maxPending,
        uploads: uploads.map((item) => ({ type: item.violationType, files: item.evidenceFiles.length,
          mime: item.evidenceFiles[0].type, confidence: item.metadata.confidence })),
      }
    } finally {
      root.unmount(); clearInterval(timer); stream.getTracks().forEach((track) => track.stop()); window.Worker = originalWorker
    }
  })
  expect(result.beforeStart).toBe(0)
  expect(result.workerModes.sort()).toEqual(['face', 'phone'])
  expect(result.terminated).toBe(true)
  expect(result.noFramesAfterStop).toBe(true)
  expect(result.cameraRequests).toBe(0)
  expect(result.streamLive).toBe(true)
  expect(result.maxPending).toBeGreaterThanOrEqual(1)
  expect(result.maxPending).toBeLessThanOrEqual(2)
  expect(result.uploads).toEqual(Array.from({ length: 2 }, () => ({ type: 'PHONE_DETECTED', files: 1, mime: 'image/jpeg', confidence: 0.9 })))
})
