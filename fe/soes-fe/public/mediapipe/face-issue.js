const FaceIssue = (() => {
  function box(landmarks) {
    if (!landmarks || landmarks.length < 50) return null
    const points = landmarks.filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y))
    if (points.length < 50) return null
    const left = Math.min(...points.map((point) => point.x))
    const right = Math.max(...points.map((point) => point.x))
    const top = Math.min(...points.map((point) => point.y))
    const bottom = Math.max(...points.map((point) => point.y))
    const width = right - left, height = bottom - top
    if (width < 0.08 || height < 0.08 || width * height < 0.008) return null
    return { left, right, top, bottom, width, height }
  }

  function distinct(first, second) {
    const overlap = Math.max(0, Math.min(first.right, second.right) - Math.max(first.left, second.left))
      * Math.max(0, Math.min(first.bottom, second.bottom) - Math.max(first.top, second.top))
    const union = first.width * first.height + second.width * second.height - overlap
    return overlap / Math.max(0.0001, union) < 0.25
  }

  function detect(result) {
    if (!result.faceLandmarks.length) return 'NO_FACE'
    const boxes = result.faceLandmarks.map(box).filter(Boolean)
    if (boxes.length > 1 && boxes.some((item, index) => index > 0 && distinct(boxes[0], item))) return 'MULTIPLE_FACES'
    const landmarks = result.faceLandmarks[0]
    const nose = landmarks[1], left = landmarks[33], right = landmarks[263]
    if (!nose || !left || !right) return null
    const offset = Math.abs(nose.x - (left.x + right.x) / 2) / Math.max(0.001, Math.abs(right.x - left.x))
    const matrix = result.facialTransformationMatrixes?.[0]?.data
    const yaw = matrix?.length >= 16 ? Math.atan2(matrix[8], Math.hypot(matrix[0], matrix[4])) * 180 / Math.PI : null
    return offset > 0.55 && (yaw === null || Math.abs(yaw) > 35) ? 'LOOKING_AWAY' : null
  }

  return { detect }
})()
