/* YOLO11n COCO detector. Runs locally in the vision worker; class 67 is cell phone. */
const PhoneYolo = (() => {
  const SIZE = 640
  const CLASS_INDEX = 67
  const MIN_SCORE = 0.25
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
    if (dimensions.length !== 3 || dimensions[1] < CLASS_INDEX + 5 || !count) {
      throw new Error('Unexpected YOLO output shape')
    }
    const candidates = []
    for (let index = 0; index < count; index++) {
      const score = values[(4 + CLASS_INDEX) * count + index]
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
        categories: [{ categoryName: 'cell phone', score }],
        boundingBox: { originX: left, originY: top, width: right - left, height: bottom - top },
      })
    }
    candidates.sort((a, b) => b.categories[0].score - a.categories[0].score)
    return { detections: candidates.slice(0, 3) }
  }

  async function create() {
    ort.env.wasm.wasmPaths = new URL('../yolo/', self.location.href).href
    ort.env.wasm.numThreads = 1
    const model = new URL('../models/yolo11n.onnx', self.location.href).href
    const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'] })
    return {
      delegate: 'WASM',
      async detectForVideo(image) {
        const input = tensorFor(image)
        try {
          const results = await session.run({ [session.inputNames[0]]: input })
          return detectionsFrom(results[session.outputNames[0]])
        } finally { input.dispose() }
      },
      close() { void session.release() },
    }
  }

  return { create, detectionsFrom }
})()
