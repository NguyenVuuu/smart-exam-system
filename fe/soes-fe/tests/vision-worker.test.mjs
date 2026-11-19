import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

const source = await readFile(new URL('../public/mediapipe/vision-worker.js', import.meta.url), 'utf8')
const phoneResult = (score = 0.9) => ({ detections: [{
  categories: [{ categoryName: 'cell phone', score }],
  boundingBox: { originX: 112.5, originY: 180, width: 67.5, height: 135 },
}] })
const faceLandmarks = (centerX, centerY) => Array.from({ length: 60 }, (_, index) => ({
  x: centerX + Math.cos(index * Math.PI / 30) * 0.12,
  y: centerY + Math.sin(index * Math.PI / 30) * 0.16,
}))

async function harness({ failGpu = false, failInference = false } = {}) {
  const messages = [], calls = [], delegates = [], stamps = [], draws = []
  let phones = phoneResult()
  let edgePhones = () => ({ detections: [] })
  let faceResult = { faceLandmarks: [[]], facialTransformationMatrixes: [] }
  let clock = 0
  let duration = 20
  const task = (kind) => ({ createFromOptions: async (_files, options) => {
    delegates.push([kind, options.baseOptions.delegate])
    if (failGpu && options.baseOptions.delegate === 'GPU') throw new Error('GPU unavailable')
    return {
      close() {},
      detectForVideo(image) {
        calls.push(kind); clock += duration
        if (failInference && options.baseOptions.delegate === 'GPU') throw new Error('Context lost')
        return kind === 'face' ? faceResult : image.lastDraw?.length === 8 ? edgePhones(image.lastDraw) : phones
      },
    }
  } })
  const self = { location: { href: 'http://localhost/mediapipe/vision-worker.js', origin: 'http://localhost' }, postMessage: (value) => messages.push(value) }
  vm.runInNewContext(source, {
    self, importScripts() {}, URL, Date, performance: { now: () => clock },
    Vision: { FilesetResolver: { forVisionTasks: async () => ({}) }, FaceLandmarker: task('face'), ObjectDetector: task('phone') },
    OffscreenCanvas: class {
      constructor(width, height) { this.width = width; this.height = height }
      getContext() { return { drawImage: (...args) => { this.lastDraw = args.slice(1); draws.push(this.lastDraw) }, fillRect() {}, strokeRect() {}, fillText: (value) => stamps.push(value) } }
      async convertToBlob() { return new Blob(['jpeg'], { type: 'image/jpeg' }) }
    },
  })
  await self.onmessage({ data: { type: 'init' } })
  return {
    messages, calls, delegates, stamps, draws,
    setPhones: (value) => { phones = value },
    setEdgePhones: (value) => { edgePhones = value },
    setFace: (value) => { faceResult = value },
    retryPhone: () => self.onmessage({ data: { type: 'phone-upload-failed' } }),
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

test('detects a phone on the first frame without repeating one continuous appearance', async () => {
  const h = await harness()
  const first = await h.frame(0)
  assert.equal(first.evidence.metadata.observedDurationMs, 0)
  for (let time = 250; time <= 10500; time += 250) await h.frame(time)
  assert.deepEqual(h.calls.slice(0, 2), ['phone', 'face'])
  const events = h.messages.filter((m) => m.evidence)
  assert.equal(events.length, 1)
  assert.equal(events[0].evidence.metadata.confidence, 0.9)
  assert.equal(events[0].evidence.metadata.boundingBox.originX, 100)
  assert.deepEqual(JSON.parse(JSON.stringify(events[0].evidence.metadata.boundingBox)), { originX: 100, originY: 80, width: 60, height: 120 })
  assert.equal(events[0].evidence.metadata.frameWidth, 640)
  assert.deepEqual(h.stamps, events.map((event) => event.evidence.metadata.capturedAt))
})

test('a phone leaving and reappearing is reported again without a time cooldown', async () => {
  const h = await harness()
  assert.ok((await h.frame(0)).evidence)
  await h.frame(100)
  h.setPhones({ detections: [] })
  assert.equal((await h.frame(200)).evidence, null)
  h.setPhones(phoneResult())
  const second = await h.frame(300)
  assert.equal(second.kind, 'face')
  assert.ok(second.evidence)
  assert.equal(second.evidence.metadata.capturedAt, new Date(1700000000300).toISOString())
})

test('captures a phone first visible during a face-analysis frame', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  assert.equal((await h.frame(0)).evidence, null)
  h.setPhones(phoneResult())
  const next = await h.frame(100)
  assert.equal(next.kind, 'face')
  assert.equal(next.evidence.metadata.observedDurationMs, 0)
  assert.equal(next.evidence.metadata.capturedAt, new Date(1700000000100).toISOString())
  assert.deepEqual(h.calls.slice(-2), ['phone', 'face'])
})

test('phone input keeps aspect ratio and detections in padding cannot become evidence', async () => {
  const h = await harness()
  const result = phoneResult()
  result.detections[0].boundingBox = { originX: 100, originY: 5, width: 50, height: 20 }
  h.setPhones(result)
  await h.frame(0)
  assert.deepEqual(h.draws[0], [0, 90, 720, 540])
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('portrait camera uses horizontal padding and maps evidence boxes to original pixels', async () => {
  const h = await harness()
  await h.frame(0, 480, 640)
  assert.deepEqual(h.draws[0], [90, 0, 540, 720])
  const event = h.messages.find((m) => m.evidence)
  assert.deepEqual(JSON.parse(JSON.stringify(event.evidence.metadata.boundingBox)), { originX: 20, originY: 160, width: 60, height: 120 })
  assert.equal(event.evidence.metadata.frameWidth, 480)
  assert.equal(event.evidence.metadata.frameHeight, 640)
})

test('low confidence does not create evidence', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.39))
  await h.frame(0)
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('an upload failure allows another immediate detection', async () => {
  const h = await harness()
  await h.frame(0)
  await h.frame(250)
  await h.frame(500)
  await h.frame(750)
  assert.equal(h.messages.filter((m) => m.evidence).length, 1)
  await h.retryPhone()
  await h.frame(1000)
  assert.equal(h.messages.filter((m) => m.evidence).length, 2)
})

test('detects a partly visible phone in a corner on the first frame', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setEdgePhones((draw) => draw[0] > 0 && draw[1] > 0 ? phoneResult(0.93) : { detections: [] })
  const result = await h.frame(0)
  assert.equal(result.evidence.metadata.confidence, 0.93)
  assert.equal(result.evidence.metadata.observedDurationMs, 0)
  assert.equal(h.calls.filter((call) => call === 'phone').length, 2)
  const box = result.evidence.metadata.boundingBox
  assert.ok(box.originX > 0 && box.originY > 0)
})

test('uses a tighter corner crop when only a small part of a phone is visible', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setEdgePhones((draw) => draw[0] > 0 && draw[1] > 0 && draw[2] <= 145 ? phoneResult(0.93) : { detections: [] })
  const result = await h.frame(0)
  assert.equal(result.evidence.metadata.observedDurationMs, 0)
  assert.equal(result.evidence.metadata.confidence, 0.93)
  assert.ok(result.evidence.metadata.boundingBox.originX > 400)
  assert.ok(result.evidence.metadata.boundingBox.originY > 300)
  assert.equal(h.calls.filter((call) => call === 'phone').length, 2)
})

test('corner scanning is bounded per frame and visits other corners', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setEdgePhones(([sx, sy]) => sx === 0 && sy === 0 ? phoneResult(0.93) : { detections: [] })
  for (let timestamp = 0; timestamp < 1500; timestamp += 250) {
    const before = h.calls.filter((call) => call === 'phone').length
    const result = await h.frame(timestamp)
    if (result.kind === 'phone') assert.ok(h.calls.filter((call) => call === 'phone').length - before <= 3)
    assert.equal(result.evidence, null)
  }
  assert.ok((await h.frame(1500)).evidence)
})

test('a central weak match cannot skip a phone visible in a corner', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.55))
  h.setEdgePhones((draw) => draw[0] > 0 && draw[1] > 0 && draw[2] <= 225 ? phoneResult(0.93) : { detections: [] })
  const result = await h.frame(0)
  assert.equal(result.evidence.metadata.confidence, 0.93)
  assert.ok(result.evidence.metadata.boundingBox.originX > 400)
})

test('a single weak false match is rejected without same-frame corroboration', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.8))
  const result = await h.frame(0)
  assert.equal(result.evidence, null)
})

test('a weak phone can be corroborated at a second scale in the same frame', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.6))
  h.setEdgePhones(([sx, sy, sw, sh, dx, dy, dw, dh]) => {
    if (sw === 224 || sw === 141) return { detections: [] }
    const result = phoneResult(0.8)
    result.detections[0].boundingBox = {
      originX: dx + (100 - sx) * dw / sw,
      originY: dy + (80 - sy) * dh / sh,
      width: 60 * dw / sw, height: 120 * dh / sh,
    }
    return result
  })
  const result = await h.frame(0)
  assert.equal(result.evidence.metadata.observedDurationMs, 0)
  assert.equal(result.evidence.metadata.confidence, 0.6)
})

test('a small low-confidence phone at the edge is confirmed in the same captured frame', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setEdgePhones(([sx, sy, sw, sh, dx, dy, dw, dh]) => {
    const corner = sw === 224 && sx > 0 && sy > 0
    const confirmation = sw < 100 && sx > 0 && sy > 0
    if (!corner && !confirmation) return { detections: [] }
    return { detections: [{
      categories: [{ categoryName: 'cell phone', score: confirmation ? 0.8 : 0.55 }],
      boundingBox: {
        originX: dx + (530 - sx) * dw / sw,
        originY: dy + (350 - sy) * dh / sh,
        width: 20 * dw / sw,
        height: 35 * dh / sh,
      },
    }] }
  })
  const result = await h.frame(0)
  assert.equal(result.evidence.metadata.confidence, 0.55)
  assert.deepEqual(JSON.parse(JSON.stringify(result.evidence.metadata.boundingBox)), {
    originX: 530, originY: 350, width: 20, height: 35,
  })
  assert.equal(result.evidence.metadata.observedDurationMs, 0)
})

test('face evidence comes from the same frame as the detected issue', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setFace({ faceLandmarks: [] })
  let result
  for (let timestamp = 0; timestamp <= 3250; timestamp += 250) result = await h.frame(timestamp)
  assert.equal(result.issue, 'NO_FACE')
  assert.ok(result.faceEvidence instanceof Blob)
  assert.equal(result.capturedAt, 1700000003250)
})

test('brief missing face does not create a violation', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setFace({ faceLandmarks: [] })
  for (let timestamp = 0; timestamp <= 1250; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
  h.setFace({ faceLandmarks: [faceLandmarks(0.5, 0.5)] })
  for (let timestamp = 1500; timestamp <= 4250; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
})

test('a duplicate face box is ignored while two distinct persistent faces are reported', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  h.setFace({ faceLandmarks: [faceLandmarks(0.5, 0.5), faceLandmarks(0.51, 0.51)] })
  for (let timestamp = 0; timestamp <= 1250; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
  h.setFace({ faceLandmarks: [faceLandmarks(0.3, 0.5), faceLandmarks(0.75, 0.5)] })
  for (let timestamp = 1500; timestamp < 2750; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
  assert.equal((await h.frame(2750)).issue, 'MULTIPLE_FACES')
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
  assert.equal((await h.frame(500)).issue, null)
  assert.ok(h.delegates.some(([kind, delegate]) => kind === 'phone' && delegate === 'CPU'))
})

test('slow inference reduces frequency while face confirmation remains active', async () => {
  const h = await harness()
  h.slow()
  const first = await h.frame(0)
  assert.equal(first.intervalMs, 150)
  h.setFace({ faceLandmarks: [faceLandmarks(0.3, 0.5), faceLandmarks(0.75, 0.5)] })
  assert.equal((await h.frame(250)).issue, null)
  await h.frame(500)
  await h.frame(750)
  await h.frame(1000)
  assert.equal((await h.frame(1250)).issue, 'MULTIPLE_FACES')
})
