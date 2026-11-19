const PhoneScan = (() => {
  const MIN_CONFIDENCE = 0.75
  const CANDIDATE_CONFIDENCE = 0.5
  const STRONG_CONFIDENCE = 0.9
  const SWEEP = [
    [3, 0.35], [2, 0.22], [1, 0.22], [0, 0.22],
    [2, 0.35], [1, 0.35], [0, 0.35],
  ]
  let sweepIndex = 0

  async function run(detector, frame, timestamp, crop) {
    return PhoneFrames.toOriginal(await detector.detectForVideo(crop.image, timestamp), crop)
  }

  function candidates(result, threshold) {
    return result.detections.filter((item) => PhoneFrames.confidence(item) >= threshold)
      .sort((a, b) => PhoneFrames.confidence(b) - PhoneFrames.confidence(a))
  }

  async function full(detector, frame, timestamp) {
    let result = await run(detector, frame, timestamp, PhoneFrames.full(frame))
    const strong = candidates(result, STRONG_CONFIDENCE)[0]
    if (strong) return result

    const collected = [...result.detections]
    let cropIndex = 0
    for (const candidate of candidates(result, MIN_CONFIDENCE)) {
      if (await PhoneFrames.confirm(detector, frame, candidate, timestamp + (++cropIndex) * 0.01)) {
        return { detections: [{ ...candidate, confirmed: true }] }
      }
    }

    const sweep = SWEEP[sweepIndex++ % SWEEP.length]
    for (const [edge, fraction] of [[3, 0.22], sweep]) {
      result = await run(detector, frame, timestamp + (++cropIndex) * 0.01,
        PhoneFrames.corner(frame, edge, fraction))
      collected.push(...result.detections)
      if (candidates(result, STRONG_CONFIDENCE).length) return result
    }

    for (const candidate of candidates({ detections: collected }, CANDIDATE_CONFIDENCE).slice(0, 2)) {
      if (await PhoneFrames.confirm(detector, frame, candidate, timestamp + (++cropIndex) * 0.01)) {
        return { detections: [{ ...candidate, confirmed: true }] }
      }
    }
    return { detections: [] }
  }

  return { full, minConfidence: MIN_CONFIDENCE }
})()
