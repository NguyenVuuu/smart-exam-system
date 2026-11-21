/* One local detector fine-tuned for phones and tablets. */
const PhoneYolo = (() => {
  const SIZE = 640
  const MIN_SCORE = 0.25
  const MODEL = {
    file: 'yolo11n-devices.onnx?v=8df47a7b7eb2',
    name: 'yolo11n-devices', version: '8df47a7b7eb2', classIndex: 67,
  }
  let canvas = null

  function tensorFor(image) {
    canvas ??= new OffscreenCanvas(SIZE, SIZE)
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) throw new Error('YOLO canvas unavailable')
    context.drawImage(image, 0, 0, SIZE, SIZE)
    const rgba = context.getImageData(0, 0, SIZE, SIZE).data
    const pixels = new Float32Array(3 * SIZE * SIZE)
    const plane = SIZE * SIZE
    for (let pixel = 0; pixel < plane; pixel++) {
      const offset = pixel * 4
      pixels[pixel] = rgba[offset] / 255
      pixels[plane + pixel] = rgba[offset + 1] / 255
      pixels[2 * plane + pixel] = rgba[offset + 2] / 255
    }
    return new ort.Tensor('float32', pixels, [1, 3, SIZE, SIZE])
  }

  function detectionsFrom(output) {
    const values = output.data
    const dimensions = output.dims
    const count = dimensions[2]
    if (dimensions.length !== 3 || dimensions[1] !== 84 || !count) {
      throw new Error('Unexpected YOLO output shape')
    }
    const candidates = []
    for (let index = 0; index < count; index++) {
      const score = values[(4 + MODEL.classIndex) * count + index]
      if (score < MIN_SCORE) continue
      const centerX = values[index], centerY = values[count + index]
      const width = values[2 * count + index], height = values[3 * count + index]
      if (![centerX, centerY, width, height].every(Number.isFinite) || width <= 0 || height <= 0) continue
      const left = Math.max(0, centerX - width / 2)
      const top = Math.max(0, centerY - height / 2)
      const right = Math.min(SIZE, centerX + width / 2)
      const bottom = Math.min(SIZE, centerY + height / 2)
      if (right <= left || bottom <= top) continue
      candidates.push({
        model: MODEL.name, modelVersion: MODEL.version,
        categories: [{ categoryName: 'handheld device', score }],
        boundingBox: { originX: left, originY: top, width: right - left, height: bottom - top },
      })
    }
    candidates.sort((a, b) => b.categories[0].score - a.categories[0].score)
    return { detections: candidates.slice(0, 3) }
  }

  async function create() {
    ort.env.wasm.wasmPaths = new URL('../yolo/', self.location.href).href
    ort.env.wasm.numThreads = 1
    const session = await ort.InferenceSession.create(
      new URL(`../models/${MODEL.file}`, self.location.href).href, { executionProviders: ['wasm'] })
    async function detect(image) {
      const input = tensorFor(image)
      try {
        const results = await session.run({ [session.inputNames[0]]: input })
        return detectionsFrom(results[session.outputNames[0]])
      } finally { input.dispose() }
    }
    return {
      delegate: 'WASM',
      detectForVideo: detect,
      close() { void session.release() },
    }
  }

  return { create, detectionsFrom }
})()
