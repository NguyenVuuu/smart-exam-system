import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'

const source = await readFile(new URL('../public/mediapipe/vision-worker.js', import.meta.url), 'utf8')
const phoneFramesSource = await readFile(new URL('../public/mediapipe/phone-frames.js', import.meta.url), 'utf8')
const phoneScanSource = await readFile(new URL('../public/mediapipe/phone-scan.js', import.meta.url), 'utf8')
const faceIssueSource = await readFile(new URL('../public/mediapipe/face-issue.js', import.meta.url), 'utf8')
const phoneResult = (score = 0.9) => ({ detections: [{
  categories: [{ categoryName: 'cell phone', score }],
  boundingBox: { originX: 100, originY: 160, width: 60, height: 120 },
}] })
const tilePhoneResult = (draws, column, box, score = 0.93) => {
  const [sx, sy, sw, sh, dx, dy, dw, dh] = draws[column]
  return { detections: [{
    categories: [{ categoryName: 'cell phone', score }],
    boundingBox: {
      originX: dx + (box.originX - sx) * dw / sw,
      originY: dy + (box.originY - sy) * dh / sh,
      width: box.width * dw / sw,
      height: box.height * dh / sh,
    },
  }] }
}
const faceLandmarks = (centerX, centerY) => Array.from({ length: 60 }, (_, index) => ({
  x: centerX + Math.cos(index * Math.PI / 30) * 0.12,
  y: centerY + Math.sin(index * Math.PI / 30) * 0.16,
}))

async function harness({ failGpu = false, failInference = false, mode = 'phone' } = {}) {
  const messages = [], calls = [], delegates = [], stamps = [], draws = []
  let phones = phoneResult()
  let darkPhones = { detections: [] }
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
        return kind === 'face' ? faceResult : image.lastDraws?.length === 4 ? edgePhones(image.lastDraws)
          : image.lastDraw?.length === 8 ? edgePhones(image.lastDraw) : phones
      },
    }
  } })
  const self = { location: { href: 'http://localhost/mediapipe/vision-worker.js', origin: 'http://localhost' }, postMessage: (value) => messages.push(value) }
  const context = vm.createContext({
    self, importScripts() {}, URL, Date, performance: { now: () => clock },
    Vision: { FilesetResolver: { forVisionTasks: async () => ({}) }, FaceLandmarker: task('face') },
    PhoneYolo: { create: async () => ({ delegate: 'WASM', close() {}, async detectForVideo(image) {
      calls.push('phone'); clock += duration
      return image.darkened ? darkPhones : image.lastDraws?.length === 4 ? edgePhones(image.lastDraws)
        : image.lastDraw?.length === 8 ? edgePhones(image.lastDraw) : phones
    } }) },
    OffscreenCanvas: class {
      constructor(width, height) { this.width = width; this.height = height }
      getContext() {
        const owner = this
        const context = {
          fillStyle: '',
          drawImage: (...args) => { owner.darkened = false; owner.lastDraw = args.slice(1); owner.lastDraws ??= []; owner.lastDraws.push(owner.lastDraw); draws.push(owner.lastDraw) },
          fillRect() { if (context.fillStyle === '#000000') owner.lastDraws = []; if (context.fillStyle === 'rgba(0,0,0,0.3)') owner.darkened = true },
          strokeRect() {}, fillText: (value) => stamps.push(value),
        }
        return context
      }
      async convertToBlob() { return new Blob(['jpeg'], { type: 'image/jpeg' }) }
    },
  })
  vm.runInContext(phoneFramesSource, context)
  vm.runInContext(phoneScanSource, context)
  vm.runInContext(faceIssueSource, context)
  vm.runInContext(source, context)
  await self.onmessage({ data: { type: 'init', mode } })
  return {
    messages, calls, delegates, stamps, draws,
    setPhones: (value) => { phones = value },
    setDarkPhones: (value) => { darkPhones = value },
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

test('separate face worker never runs phone inference', async () => {
  const h = await harness({ mode: 'face' })
  await h.frame(0)
  await h.frame(200)
  assert.deepEqual(h.calls, ['face', 'face'])
})

test('separate phone worker never runs face inference', async () => {
  const h = await harness({ mode: 'phone' })
  await h.frame(0)
  await h.frame(200)
  assert.ok(h.calls.length >= 2)
  assert.ok(h.calls.every((kind) => kind === 'phone'))
})

test('detects a phone on the first frame without repeating one continuous appearance', async () => {
  const h = await harness()
  const first = await h.frame(0)
  assert.equal(first.evidence.metadata.observedDurationMs, 0)
  for (let time = 250; time <= 10500; time += 250) await h.frame(time)
  assert.ok(h.calls.every((kind) => kind === 'phone'))
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
  assert.equal(second.kind, 'phone')
  assert.ok(second.evidence)
  assert.equal(second.evidence.metadata.capturedAt, new Date(1700000000300).toISOString())
})

test('captures a phone first visible on the next phone frame', async () => {
  const h = await harness()
  h.setPhones({ detections: [] })
  assert.equal((await h.frame(0)).evidence, null)
  h.setPhones(phoneResult())
  const next = await h.frame(100)
  assert.equal(next.kind, 'phone')
  assert.equal(next.evidence.metadata.observedDurationMs, 0)
  assert.equal(next.evidence.metadata.capturedAt, new Date(1700000000100).toISOString())
  assert.ok(h.calls.every((kind) => kind === 'phone'))
})

test('phone input keeps aspect ratio and detections in padding cannot become evidence', async () => {
  const h = await harness()
  const result = phoneResult()
  result.detections[0].boundingBox = { originX: 100, originY: 5, width: 50, height: 20 }
  h.setPhones(result)
  await h.frame(0)
  assert.deepEqual(h.draws[0], [0, 80, 640, 480])
  assert.equal(h.messages.filter((m) => m.evidence).length, 0)
})

test('portrait camera uses horizontal padding and maps evidence boxes to original pixels', async () => {
  const h = await harness()
  await h.frame(0, 480, 640)
  assert.deepEqual(h.draws[0], [80, 0, 480, 640])
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

test('a weak rear-side device needs a matching darkened scan of the same frame', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.34))
  h.setDarkPhones(phoneResult(0.38))
  const event = await h.frame(0)
  assert.equal(event.evidence.metadata.confidence, 0.34)
  assert.equal(event.evidence.metadata.observedDurationMs, 0)
})

test('a dark-screen candidate is checked before scanning the rest of the frame', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.8))
  h.setDarkPhones(phoneResult(0.82))
  const event = await h.frame(0)
  assert.ok(event.evidence)
  assert.equal(event.evidence.metadata.confidence, 0.8)
  assert.equal(h.calls.length, 3)
})

test('a weak lookalike at a different position is not evidence', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.34))
  const shifted = phoneResult(0.7)
  shifted.detections[0].boundingBox.originX = 430
  h.setDarkPhones(shifted)
  assert.equal((await h.frame(0)).evidence, null)
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

test('two mosaic scans cover all eight regions of the frame', async () => {
  for (let region = 0; region < 8; region++) {
    const h = await harness()
    h.setPhones({ detections: [] })
    const row = Math.floor(region / 4), column = region % 4
    const box = { originX: 55 + column * 145, originY: row ? 340 : 80, width: 35, height: 45 }
    h.setEdgePhones((draws) => Array.isArray(draws[0]) && draws.length === 4 &&
      (draws[0][1] > 0 ? 1 : 0) === row ? tilePhoneResult(draws, column, box) : { detections: [] })
    const result = await h.frame(0)
    assert.ok(result.evidence)
    assert.equal(result.evidence.metadata.observedDurationMs, 0)
    assert.equal(h.calls.filter((call) => call === 'phone').length, row === 0 ? 2 : 3)
    assert.deepEqual(JSON.parse(JSON.stringify(result.evidence.metadata.boundingBox)), box)
  }
})

test('magnified regions have no uncovered pixels on landscape and portrait frames', async () => {
  for (const [width, height] of [[640, 480], [1280, 720], [480, 640]]) {
    const h = await harness()
    h.setPhones({ detections: [] })
    await h.frame(0, width, height)
    const regions = h.draws.slice(1).filter((draw) => draw.length === 8)
    assert.equal(regions.length, 8)
    for (let y = 0; y < height; y += 10) {
      for (let x = 0; x < width; x += 10) {
        assert.ok(regions.some(([sx, sy, sw, sh]) =>
          x >= sx && x < sx + sw && y >= sy && y < sy + sh), `uncovered ${x},${y}`)
      }
    }
  }
})

test('a central weak match cannot skip a phone visible in a tile', async () => {
  const h = await harness()
  h.setPhones(phoneResult(0.55))
  h.setEdgePhones((draws) => Array.isArray(draws[0]) ?
    tilePhoneResult(draws, 3, { originX: 550, originY: 80, width: 30, height: 50 }) : { detections: [] })
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
  h.setEdgePhones((draw) => {
    if (Array.isArray(draw[0])) return { detections: [] }
    const [sx, sy, sw, sh, dx, dy, dw, dh] = draw
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
  h.setEdgePhones((draw) => {
    if (Array.isArray(draw[0])) return draw[0][1] > 0 ?
      tilePhoneResult(draw, 3, { originX: 578, originY: 410, width: 22, height: 31 }, 0.55) : { detections: [] }
    const [sx, sy, sw, sh, dx, dy, dw, dh] = draw
    if (!(sw < 100 && sx > 0 && sy > 0)) return { detections: [] }
    return { detections: [{
      categories: [{ categoryName: 'cell phone', score: 0.8 }],
      boundingBox: {
        originX: dx + (578 - sx) * dw / sw,
        originY: dy + (410 - sy) * dh / sh,
        width: 22 * dw / sw, height: 31 * dh / sh,
      },
    }] }
  })
  const result = await h.frame(0)
  assert.equal(result.evidence.metadata.confidence, 0.55)
  assert.deepEqual(JSON.parse(JSON.stringify(result.evidence.metadata.boundingBox)), {
    originX: 578, originY: 410, width: 22, height: 31,
  })
  assert.equal(result.evidence.metadata.observedDurationMs, 0)
})

test('face evidence comes from the same frame as the detected issue', async () => {
  const h = await harness({ mode: 'face' })
  h.setPhones({ detections: [] })
  h.setFace({ faceLandmarks: [] })
  let result
  for (let timestamp = 0; timestamp <= 3000; timestamp += 250) result = await h.frame(timestamp)
  assert.equal(result.issue, 'NO_FACE')
  assert.ok(result.faceEvidence instanceof Blob)
  assert.equal(result.capturedAt, 1700000003000)
})

test('brief missing face does not create a violation', async () => {
  const h = await harness({ mode: 'face' })
  h.setPhones({ detections: [] })
  h.setFace({ faceLandmarks: [] })
  for (let timestamp = 0; timestamp <= 1250; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
  h.setFace({ faceLandmarks: [faceLandmarks(0.5, 0.5)] })
  for (let timestamp = 1500; timestamp <= 4250; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
})

test('a duplicate face box is ignored while two distinct persistent faces are reported', async () => {
  const h = await harness({ mode: 'face' })
  h.setPhones({ detections: [] })
  h.setFace({ faceLandmarks: [faceLandmarks(0.5, 0.5), faceLandmarks(0.51, 0.51)] })
  for (let timestamp = 0; timestamp <= 1250; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
  h.setFace({ faceLandmarks: [faceLandmarks(0.3, 0.5), faceLandmarks(0.75, 0.5)] })
  for (let timestamp = 1500; timestamp < 2500; timestamp += 250) assert.equal((await h.frame(timestamp)).issue, null)
  assert.equal((await h.frame(2500)).issue, 'MULTIPLE_FACES')
})

test('looking away requires 1.5 seconds and resets when facing the camera again', async () => {
  const h = await harness({ mode: 'face' })
  const turned = Array.from({ length: 264 }, () => ({ x: 0.5, y: 0.5 }))
  turned[1] = { x: 0.9, y: 0.5 }
  turned[2] = { x: 0.3, y: 0.3 }
  turned[3] = { x: 0.7, y: 0.7 }
  turned[33] = { x: 0.4, y: 0.5 }
  turned[263] = { x: 0.6, y: 0.5 }
  h.setFace({ faceLandmarks: [turned] })
  for (let timestamp = 0; timestamp < 1500; timestamp += 250) {
    assert.equal((await h.frame(timestamp)).issue, null)
  }
  assert.equal((await h.frame(1500)).issue, 'LOOKING_AWAY')
  h.setFace({ faceLandmarks: [faceLandmarks(0.5, 0.5)] })
  assert.equal((await h.frame(1750)).issue, null)
  h.setFace({ faceLandmarks: [turned] })
  assert.equal((await h.frame(2000)).issue, null)
})

test('face GPU initialization falls back to CPU', async () => {
  const h = await harness({ failGpu: true, mode: 'face' })
  assert.equal(h.messages[0].type, 'ready')
  assert.equal(h.messages[0].faceDelegate, 'CPU')
})

test('lost GPU context falls back without processing stale frame again', async () => {
  const h = await harness({ failInference: true, mode: 'face' })
  assert.equal((await h.frame(0)).skipped, true)
  assert.equal((await h.frame(250)).issue, null)
  assert.ok(h.delegates.some(([kind, delegate]) => kind === 'face' && delegate === 'CPU'))
})

test('slow inference reduces frequency while face confirmation remains active', async () => {
  const h = await harness({ mode: 'face' })
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
