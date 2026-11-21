const PhoneFrames = (() => {
  const INPUT_SIZE = 640
  let fullCanvas
  let cropCanvas
  let tileCanvas

  function draw(frame, sourceX, sourceY, sourceWidth, sourceHeight, canvas) {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Phone input canvas unavailable')
    const scale = INPUT_SIZE / Math.max(sourceWidth, sourceHeight)
    const width = sourceWidth * scale
    const height = sourceHeight * scale
    const offsetX = Math.floor((INPUT_SIZE - width) / 2)
    const offsetY = Math.floor((INPUT_SIZE - height) / 2)
    context.fillStyle = '#000000'
    context.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE)
    if (sourceX === 0 && sourceY === 0 && sourceWidth === frame.width && sourceHeight === frame.height) {
      context.drawImage(frame, offsetX, offsetY, width, height)
    } else {
      context.drawImage(frame, sourceX, sourceY, sourceWidth, sourceHeight, offsetX, offsetY, width, height)
    }
    return { image: canvas, scale, offsetX, offsetY, sourceX, sourceY, sourceWidth, sourceHeight }
  }

  function full(frame) {
    fullCanvas ??= new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE)
    return draw(frame, 0, 0, frame.width, frame.height, fullCanvas)
  }

  function tileRow(frame, row) {
    // Two overlapping rows of four crops cover every source pixel at a larger scale.
    tileCanvas ??= new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE)
    const context = tileCanvas.getContext('2d')
    if (!context) throw new Error('Phone tile canvas unavailable')
    context.fillStyle = '#000000'
    context.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE)
    const sourceWidth = Math.max(1, Math.round(frame.width * 0.28))
    const sourceHeight = Math.max(1, Math.round(frame.height * 0.55))
    const scale = (INPUT_SIZE / 2) / Math.max(sourceWidth, sourceHeight)
    const width = sourceWidth * scale, height = sourceHeight * scale
    const tiles = []
    for (let column = 0; column < 4; column++) {
      const sourceX = Math.round((frame.width - sourceWidth) * column / 3)
      const sourceY = row === 0 ? 0 : frame.height - sourceHeight
      const tileX = column % 2 * (INPUT_SIZE / 2)
      const tileY = Math.floor(column / 2) * (INPUT_SIZE / 2)
      const offsetX = tileX + Math.floor((INPUT_SIZE / 2 - width) / 2)
      const offsetY = tileY + Math.floor((INPUT_SIZE / 2 - height) / 2)
      context.drawImage(frame, sourceX, sourceY, sourceWidth, sourceHeight, offsetX, offsetY, width, height)
      tiles.push({ sourceX, sourceY, sourceWidth, sourceHeight, offsetX, offsetY, scale, tileX, tileY })
    }
    return { image: tileCanvas, tiles }
  }

  function toOriginal(result, transform) {
    return { ...result, detections: result.detections.flatMap((detection) => {
      const box = detection.boundingBox
      if (!box) return []
      if (transform.tiles) {
        const centerX = box.originX + box.width / 2
        const centerY = box.originY + box.height / 2
        const tile = transform.tiles.find((item) => centerX >= item.tileX && centerX < item.tileX + INPUT_SIZE / 2 &&
          centerY >= item.tileY && centerY < item.tileY + INPUT_SIZE / 2)
        if (!tile || box.originX < tile.tileX || box.originY < tile.tileY ||
          box.originX + box.width > tile.tileX + INPUT_SIZE / 2 ||
          box.originY + box.height > tile.tileY + INPUT_SIZE / 2) return []
        return toOriginal({ detections: [detection] }, tile).detections
      }
      const clampX = (value) => Math.max(transform.sourceX, Math.min(transform.sourceX + transform.sourceWidth,
        Math.round(transform.sourceX + (value - transform.offsetX) / transform.scale)))
      const clampY = (value) => Math.max(transform.sourceY, Math.min(transform.sourceY + transform.sourceHeight,
        Math.round(transform.sourceY + (value - transform.offsetY) / transform.scale)))
      const x = clampX(box.originX), y = clampY(box.originY)
      const right = clampX(box.originX + box.width), bottom = clampY(box.originY + box.height)
      if (right <= x || bottom <= y) return []
      return [{ ...detection, boundingBox: { originX: x, originY: y, width: right - x, height: bottom - y } }]
    }) }
  }

  function confidence(detection) {
    return detection.categories[0]?.score ?? 0
  }

  function overlaps(first, second) {
    const left = Math.max(first.originX, second.originX)
    const top = Math.max(first.originY, second.originY)
    const right = Math.min(first.originX + first.width, second.originX + second.width)
    const bottom = Math.min(first.originY + first.height, second.originY + second.height)
    const intersection = Math.max(0, right - left) * Math.max(0, bottom - top)
    return intersection / Math.max(1, first.width * first.height + second.width * second.height - intersection) >= 0.35
  }

  async function confirm(detector, frame, detection, timestamp, threshold = 0.65) {
    const box = detection.boundingBox
    const padding = Math.max(box.width, box.height) * 0.75
    const sourceX = Math.max(0, box.originX - padding)
    const sourceY = Math.max(0, box.originY - padding)
    const sourceWidth = Math.min(frame.width, box.originX + box.width + padding) - sourceX
    const sourceHeight = Math.min(frame.height, box.originY + box.height + padding) - sourceY
    cropCanvas ??= new OffscreenCanvas(INPUT_SIZE, INPUT_SIZE)
    const crop = draw(frame, sourceX, sourceY, sourceWidth, sourceHeight, cropCanvas)
    const result = toOriginal(await detector.detectForVideo(crop.image, timestamp), crop)
    return result.detections.some((item) => confidence(item) >= threshold &&
      item.categories[0]?.categoryName === detection.categories[0]?.categoryName && overlaps(box, item.boundingBox))
  }

  async function confirmDark(detector, frame, detection, timestamp, threshold = 0.3) {
    const crop = full(frame)
    const context = crop.image.getContext('2d')
    if (!context) return false
    context.fillStyle = 'rgba(0,0,0,0.3)'
    context.fillRect(0, 0, INPUT_SIZE, INPUT_SIZE)
    const result = toOriginal(await detector.detectForVideo(crop.image, timestamp), crop)
    return result.detections.some((item) => confidence(item) >= threshold &&
      item.categories[0]?.categoryName === detection.categories[0]?.categoryName &&
      overlaps(detection.boundingBox, item.boundingBox))
  }

  return { full, tileRow, toOriginal, confidence, confirm, confirmDark }
})()
