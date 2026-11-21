import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { chromium } from 'playwright'

const [positiveDirectory, negativeDirectory, modelPath] = process.argv.slice(2)
if (!positiveDirectory || !negativeDirectory) {
  throw new Error('Usage: node scripts/evaluate-device-worker.mjs POSITIVE_DIR NEGATIVE_DIR [MODEL_ONNX]')
}

async function images(directory, expected) {
  const names = (await readdir(directory)).filter((name) => /\.(jpe?g|png)$/i.test(name)).sort()
  return Promise.all(names.map(async (name) => ({
    name, expected,
    dataUrl: `data:image/${name.toLowerCase().endsWith('.png') ? 'png' : 'jpeg'};base64,${
      (await readFile(join(directory, name))).toString('base64')}`,
  })))
}

const samples = [...await images(positiveDirectory, true), ...await images(negativeDirectory, false)]
const browser = await chromium.launch({ headless: true })
try {
  const page = await browser.newPage()
  page.setDefaultTimeout(300_000)
  if (modelPath) {
    const model = await readFile(modelPath)
    await page.route('**/models/yolo11n-devices.onnx*', (route) => route.fulfill({
      contentType: 'application/octet-stream', body: model,
    }))
  }
  await page.goto('http://127.0.0.1:5174/')
  const results = await page.evaluate(async (items) => {
    const worker = new Worker('/mediapipe/vision-worker.js')
    const next = () => new Promise((resolve, reject) => {
      worker.onmessage = ({ data }) => data.type === 'error' ? reject(new Error(data.message)) : resolve(data)
      worker.onerror = (error) => reject(error)
    })
    try {
      const ready = next()
      worker.postMessage({ type: 'init', mode: 'phone', debug: true })
      await ready
      const output = []
      for (const item of items) {
        const image = new Image()
        image.src = item.dataUrl
        await image.decode()
        const frame = await createImageBitmap(image)
        worker.postMessage({ type: 'phone-upload-failed' })
        const pending = next()
        const started = performance.now()
        worker.postMessage({ type: 'frame', frame, timestamp: started, capturedAt: Date.now() }, [frame])
        const response = await pending
        output.push({ name: item.name, expected: item.expected, detected: Boolean(response.evidence),
          confidence: response.evidence?.metadata?.confidence ?? null,
          box: response.evidence?.metadata?.boundingBox ?? null,
          elapsedMs: Math.round(performance.now() - started), inferenceMs: Math.round(response.inferenceMs) })
      }
      return output
    } finally { worker.terminate() }
  }, samples)
  for (const result of results) console.log(JSON.stringify(result))
  const positives = results.filter((item) => item.expected)
  const negatives = results.filter((item) => !item.expected)
  console.log(JSON.stringify({
    positives: `${positives.filter((item) => item.detected).length}/${positives.length}`,
    falsePositives: `${negatives.filter((item) => item.detected).length}/${negatives.length}`,
    averageMs: Math.round(results.reduce((sum, item) => sum + item.elapsedMs, 0) / results.length),
  }))
} finally { await browser.close() }
