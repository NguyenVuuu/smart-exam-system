const PhoneScan = (() => {
  const MIN_CONFIDENCE = 0.75
  const CANDIDATE_CONFIDENCE = 0.3
  const STRONG_CONFIDENCE = 0.9

  async function run(detector, timestamp, crop) {
    return PhoneFrames.toOriginal(await detector.detectForVideo(crop.image, timestamp), crop)
  }

  function candidates(result, threshold) {
    return result.detections.filter((item) => PhoneFrames.confidence(item) >= threshold)
      .sort((a, b) => PhoneFrames.confidence(b) - PhoneFrames.confidence(a))
  }

  async function confirmed(detector, frame, candidate, nextTimestamp) {
    if (await PhoneFrames.confirm(detector, frame, candidate, nextTimestamp())) return true
    return PhoneFrames.confirmDark(detector, frame, candidate, nextTimestamp())
  }

  async function full(detector, frame, timestamp) {
    let result = await run(detector, timestamp, PhoneFrames.full(frame))
    const strong = candidates(result, STRONG_CONFIDENCE)[0]
    if (strong) return result

    const collected = [...result.detections]
    let cropIndex = 0
    const nextTimestamp = () => timestamp + (++cropIndex) * 0.01
    const checked = new Set()
    for (const candidate of candidates(result, MIN_CONFIDENCE)) {
      checked.add(candidate)
      if (await confirmed(detector, frame, candidate, nextTimestamp)) {
        return { detections: [{ ...candidate, confirmed: true }] }
      }
    }

    for (let row = 0; row < 2; row++) {
      result = await run(detector, nextTimestamp(), PhoneFrames.tileRow(frame, row))
      collected.push(...result.detections)
      if (candidates(result, STRONG_CONFIDENCE).length) return result
    }

    const remaining = candidates({ detections: collected }, CANDIDATE_CONFIDENCE)
      .filter((item) => !checked.has(item)).slice(0, 2)
    for (const candidate of remaining) {
      if (await confirmed(detector, frame, candidate, nextTimestamp)) {
        return { detections: [{ ...candidate, confirmed: true }] }
      }
    }
    return { detections: [] }
  }

  return { full, minConfidence: MIN_CONFIDENCE }
})()
