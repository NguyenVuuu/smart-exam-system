import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'
import test from 'node:test'
import * as ort from 'onnxruntime-web'

const source = await readFile(new URL('../public/mediapipe/phone-yolo.js', import.meta.url), 'utf8')
const model = new URL('../public/models/yolo11n-devices.onnx', import.meta.url)

test('YOLO model accepts the webcam input shape and has the expected COCO output', async () => {
  const session = await ort.InferenceSession.create(await readFile(model), { executionProviders: ['wasm'] })
  try {
    const input = new ort.Tensor('float32', new Float32Array(3 * 640 * 640), [1, 3, 640, 640])
    const result = await session.run({ [session.inputNames[0]]: input })
    assert.deepEqual(result[session.outputNames[0]].dims, [1, 84, 8400])
  } finally { await session.release() }
})

test('decodes the handheld-device score and box without confusing another COCO class', async () => {
  const context = vm.createContext({ OffscreenCanvas: class {}, ort: {}, URL, self: { location: { href: 'http://localhost/mediapipe/vision-worker.js' } } })
  vm.runInContext(`${source}\nthis.decode = PhoneYolo.detectionsFrom`, context)
  const count = 2
  const values = new Float32Array(84 * count)
  values[0] = 320; values[count] = 320; values[2 * count] = 80; values[3 * count] = 160
  values[(4 + 67) * count] = 0.85
  values[1] = 100; values[count + 1] = 100; values[2 * count + 1] = 50; values[3 * count + 1] = 100
  values[(4 + 0) * count + 1] = 0.98
  const result = context.decode({ data: values, dims: [1, 84, count] })
  assert.equal(result.detections.length, 1)
  assert.equal(result.detections[0].categories[0].categoryName, 'handheld device')
  assert.equal(result.detections[0].model, 'yolo11n-devices')
  const version = createHash('sha256').update(await readFile(model)).digest('hex').slice(0, 12)
  assert.equal(result.detections[0].modelVersion, version)
  assert.ok(source.includes(`yolo11n-devices.onnx?v=${version}`))
  assert.ok(Math.abs(result.detections[0].categories[0].score - 0.85) < 0.000001)
  assert.deepEqual(JSON.parse(JSON.stringify(result.detections[0].boundingBox)), {
    originX: 280, originY: 240, width: 80, height: 160,
  })
})

test('the real WASM runtime can reuse input memory after output tensors are disposed', async () => {
  const session = await ort.InferenceSession.create(await readFile(model), { executionProviders: ['wasm'] })
  const context = vm.createContext({
    OffscreenCanvas: class {
      getContext() { return { drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(640 * 640 * 4) }) } }
    },
    Float32Array, URL, self: { location: { href: 'http://localhost/mediapipe/vision-worker.js' } },
    ort: { env: { wasm: {} }, Tensor: ort.Tensor, InferenceSession: { create: async () => session } },
  })
  vm.runInContext(`${source}\nthis.createDetector = PhoneYolo.create`, context)
  try {
    const detector = await context.createDetector()
    const first = await detector.detectForVideo({})
    const second = await detector.detectForVideo({})
    assert.deepEqual(JSON.parse(JSON.stringify(second)), JSON.parse(JSON.stringify(first)))
  } finally { await session.release() }
})

test('inference disposes input and every output even when output decoding fails', async () => {
  const disposed = []
  const inputs = []
  let invalid = false
  const context = vm.createContext({
    OffscreenCanvas: class {
      getContext() { return { drawImage() {}, getImageData: () => ({ data: new Uint8ClampedArray(640 * 640 * 4) }) } }
    },
    URL, self: { location: { href: 'http://localhost/mediapipe/vision-worker.js' } },
    ort: {
      env: { wasm: {} },
      Tensor: class {
        constructor(_type, data) { inputs.push(data) }
        dispose() { disposed.push('input') }
      },
      InferenceSession: { create: async () => ({
        inputNames: ['images'], outputNames: ['output'],
        run: async () => ({
          output: { data: new Float32Array(84), dims: invalid ? [1] : [1, 84, 1], dispose() { disposed.push('output') } },
          extra: { dispose() { disposed.push('extra') } },
        }),
        release() {},
      }) },
    },
  })
  vm.runInContext(`${source}\nthis.createDetector = PhoneYolo.create`, context)
  const detector = await context.createDetector()
  assert.equal((await detector.detectForVideo({})).detections.length, 0)
  assert.deepEqual(disposed, ['output', 'extra', 'input'])
  invalid = true
  await assert.rejects(detector.detectForVideo({}), /Unexpected YOLO output shape/)
  assert.deepEqual(disposed, ['output', 'extra', 'input', 'output', 'extra', 'input'])
  assert.equal(inputs[0], inputs[1])
})
