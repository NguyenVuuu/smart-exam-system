import assert from 'node:assert/strict'
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

test('decodes the handheld-device score and box without confusing another COCO class', () => {
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
  assert.equal(result.detections[0].modelVersion, '276e8d427790')
  assert.ok(Math.abs(result.detections[0].categories[0].score - 0.85) < 0.000001)
  assert.deepEqual(JSON.parse(JSON.stringify(result.detections[0].boundingBox)), {
    originX: 280, originY: 240, width: 80, height: 160,
  })
})
