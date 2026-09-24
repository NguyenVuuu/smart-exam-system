import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

const source = await readFile(new URL('../public/mediapipe/vision-worker.js', import.meta.url), 'utf8')
const phoneResult = (score = 0.9) => ({ detections: [{
  categories: [{ categoryName: 'cell phone', score }],
  boundingBox: { originX: 112.5, originY: 180, width: 67.5, height: 135 },
}] })

async function harness({ failGpu = false, failInference = false } = {}) {
  const messages = [], calls = [], delegates = [], stamps = [], draws = []
  let phones = phoneResult()
  let faceResult = { faceLandmarks: [], facialTransformationMatrixes: [] }
  let clock = 0
  let duration = 20
  const task = (kind) => ({ createFromOptions: async (_files, options) => {
    delegates.push([kind, options.baseOptions.delegate])
    if (failGpu && options.baseOptions.delegate === 'GPU') throw new Error('GPU unavailable')
    return {
      close() {},
      detectForVideo() {
        calls.push(kind); clock += duration
        if (failInference && options.baseOptions.delegate === 'GPU') throw new Error('Context lost')
        return kind === 'face' ? faceResult : phones
      },
    }
  } })
  const self = { location: { href: 'http://localhost/mediapipe/vision-worker.js', origin: 'http://localhost' }, postMessage: (value) => messages.push(value) }
  vm.runInNewContext(source, {
    self, importScripts() {}, URL, Date, performance: { now: () => clock },
    Vision: { FilesetResolver: { forVisionTasks: async () => ({}) }, FaceLandmarker: task('face'), ObjectDetector: task('phone') },
    OffscreenCanvas: class {
      constructor(width, height) { this.width = width; this.height = height }
      getContext() { return { drawImage: (...args) => draws.push(args.slice(1)), fillRect() {}, fillText: (value) => stamps.push(value) } }
      async convertToBlob() { return new Blob(['jpeg'], { type: 'image/jpeg' }) }
    },
  })
  await self.onmessage({ data: { type: 'init' } })
  return {
    messages, calls, delegates, stamps, draws,
    setPhones: (value) => { phones = value },
    setFace: (value) => { faceResult = value },
    slow: () => { duration = 900 },
    async frame(timestamp, width = 640, height = 480) {
      let closed = false
      await self.onmessage({ data: { type: 'frame', timestamp, capturedAt: 1700000000000 + timestamp,
        frame: { width, height, close() { closed = true } },
      } })
      assert.ok(closed, 'every frame must be released')
      return messages.at(-1)
    },
  }
}

test('alternates face/phone, waits 3 seconds, captures once and repeats only after 10 seconds', async () => {
  const h = await harness()
  for (let time = 0; time <= 14000; time += 250) await h.frame(time)
  assert.deepEqual(h.calls.slice(0, 4), ['face', 'phone', 'face', 'phone'])
  const events = h.messages.filter((m) => m.evidence)
  assert.equal(events.length, 2)
  assert.equal(events[0].evidence.metadata.observedDurationMs, 3000)
  assert.equal(Date.parse(events[1].evidence.metadata.capturedAt) - Date.parse(events[0].evidence.metadata.capturedAt), 10000)
  assert.equal(events[0].evidence.metadata.confidence, 0.9)
  assert.equal(events[0].evidence.metadata.boundingBox.originX, 100)
  assert.deepEqual(JSON.parse(JSON.stringify(events[0].evidence.metadata.boundingBox)), { originX: 100, originY: 80, width: 60, height: 120 })
  assert.equal(events[0].evidence.metadata.frameWidth, 640)
  assert.deepEqual(h.stamps, events.map((event) => event.evidence.metadata.capturedAt))
})

test('phone input keeps aspect ratio and detections in padding cannot become evidence', async () => {
  const h = await harness()
  const result = phoneResult()
  result.detections[0].boundingBox = { originX: 100, originY: 5, width: 50, height: 20 }
  h.setPhones(result)
  for (let t = 0; t <= 4000; t += 250) await h.frame(t)
  assert.deepEqual(h.draws[0], [0, 90, 720, 540])
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('portrait camera uses horizontal padding and maps evidence boxes to original pixels', async () => {
  const h = await harness()
  for (let t = 0; t <= 3250; t += 250) await h.frame(t, 480, 640)
  assert.deepEqual(h.draws[0], [90, 0, 540, 720])
  const event = h.messages.find((m) => m.evidence)
  assert.deepEqual(JSON.parse(JSON.stringify(event.evidence.metadata.boundingBox)), { originX: 20, originY: 160, width: 60, height: 120 })
  assert.equal(event.evidence.metadata.frameWidth, 480)
  assert.equal(event.evidence.metadata.frameHeight, 640)
})

test('short appearances, absent detections and low confidence never create evidence', async () => {
  const h = await harness()
  for (let t = 0; t < 2500; t += 250) await h.frame(t)
  h.setPhones({ detections: [] })
  await h.frame(2500); await h.frame(2750)
  h.setPhones(phoneResult(0.49))
  for (let t = 3000; t < 8000; t += 250) await h.frame(t)
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('a long gap cannot count as continuous observation', async () => {
  const h = await harness()
  await h.frame(0); await h.frame(250)
  await h.frame(10000); await h.frame(10250)
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('a single missed sample pauses confirmation without losing positive progress', async () => {
  const h = await harness()
  for (let t = 0; t <= 2250; t += 250) await h.frame(t)
  h.setPhones({ detections: [] })
  await h.frame(2500); await h.frame(2750)
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
  h.setPhones(phoneResult(0.55))
  for (let t = 3000; t <= 4250; t += 250) await h.frame(t)
  const events = h.messages.filter((m) => m.evidence)
  assert.equal(events.length, 1)
  assert.equal(events[0].evidence.metadata.observedDurationMs, 3000)
  assert.equal(events[0].evidence.metadata.confidence, 0.55)
})

test('a sustained disappearance resets progress and never captures a missing phone', async () => {
  const h = await harness()
  for (let t = 0; t <= 2250; t += 250) await h.frame(t)
  h.setPhones({ detections: [] })
  for (let t = 2500; t <= 4750; t += 250) await h.frame(t)
  h.setPhones(phoneResult())
  for (let t = 5000; t <= 6750; t += 250) await h.frame(t)
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('GPU initialization failures fall back to CPU for both tasks', async () => {
  const h = await harness({ failGpu: true })
  assert.equal(h.messages[0].type, 'ready')
  assert.equal(h.messages[0].faceDelegate, 'CPU')
  assert.equal(h.messages[0].phoneDelegate, 'CPU')
})

test('lost GPU context falls back without processing stale frame again', async () => {
  const h = await harness({ failInference: true })
  assert.equal((await h.frame(0)).skipped, true)
  assert.equal((await h.frame(250)).skipped, true)
  assert.equal((await h.frame(500)).issue, 'NO_FACE')
  assert.ok(h.delegates.some(([kind, delegate]) => kind === 'phone' && delegate === 'CPU'))
})

test('slow inference reduces frequency and face rules remain active', async () => {
  const h = await harness()
  h.slow()
  const first = await h.frame(0)
  assert.ok(first.intervalMs > 250)
  h.setFace({ faceLandmarks: [[], []] })
  await h.frame(250)
  assert.equal((await h.frame(500)).issue, 'MULTIPLE_FACES')
})
