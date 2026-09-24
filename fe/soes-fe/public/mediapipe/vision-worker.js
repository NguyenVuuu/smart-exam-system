/* Classic worker: MediaPipe's WASM loader uses importScripts. */
importScripts('./vision_bundle.js')
const vision = Vision

let face = null
let phone = null
let faceDelegate = 'GPU'
let phoneDelegate = 'GPU'
let fileset = null
let busy = false
let nextTask = 'face'
let intervalMs = 250
let lastPhoneSampleAt = null
let lastPhoneAlertAt = -Infinity
let initialized = false
let debug = false
let lastPhoneSeenAt = null
let phonePositiveMs = 0
let previousPhonePositive = false
let phoneDiagnostics = null
const PHONE_CONFIDENCE = 0.5
const PHONE_MISSING_TOLERANCE_MS = 1200
const PHONE_INPUT_SIZE = 720
let phoneCanvas = null

function preparePhoneFrame(frame) {
  phoneCanvas ??= new OffscreenCanvas(PHONE_INPUT_SIZE, PHONE_INPUT_SIZE)
  const context = phoneCanvas.getContext('2d')
  if (!context) throw new Error('Phone input canvas unavailable')
  const scale = PHONE_INPUT_SIZE / Math.max(frame.width, frame.height)
  const width = frame.width * scale
  const height = frame.height * scale
  const offsetX = Math.floor((PHONE_INPUT_SIZE - width) / 2)
  const offsetY = Math.floor((PHONE_INPUT_SIZE - height) / 2)
  // Preserve camera aspect ratio when passing a rectangular frame to a square model.
  context.fillStyle = '#000000'
  context.fillRect(0, 0, PHONE_INPUT_SIZE, PHONE_INPUT_SIZE)
  context.drawImage(frame, offsetX, offsetY, width, height)
  return { image: phoneCanvas, scale, offsetX, offsetY }
}

function phoneResultInOriginalFrame(result, transform, frame) {
  return { ...result, detections: result.detections.flatMap((detection) => {
    const box = detection.boundingBox
    if (!box) return []
    const x = Math.max(0, Math.min(frame.width, Math.round((box.originX - transform.offsetX) / transform.scale)))
    const y = Math.max(0, Math.min(frame.height, Math.round((box.originY - transform.offsetY) / transform.scale)))
    const right = Math.max(0, Math.min(frame.width, Math.round((box.originX + box.width - transform.offsetX) / transform.scale)))
    const bottom = Math.max(0, Math.min(frame.height, Math.round((box.originY + box.height - transform.offsetY) / transform.scale)))
    if (right <= x || bottom <= y) return []
    return [{ ...detection, boundingBox: { originX: x, originY: y, width: right - x, height: bottom - y } }]
  }) }
}

function resetPhoneObservation() {
  lastPhoneSeenAt = null
  phonePositiveMs = 0
  previousPhonePositive = false
}

async function createTask(kind, delegate) {
  const baseOptions = {
    modelAssetPath: new URL(kind === 'face' ? '../models/face_landmarker.task' : '../models/efficientdet_lite0.tflite', self.location.href).href,
    delegate,
  }
  // Each task owns its WebGL context; inference is still serialized in this worker.
  const canvas = new OffscreenCanvas(1, 1)
  if (kind === 'face') {
    return vision.FaceLandmarker.createFromOptions(fileset, {
      baseOptions, canvas, runningMode: 'VIDEO', numFaces: 3,
      minFaceDetectionConfidence: 0.55, minFacePresenceConfidence: 0.55,
      minTrackingConfidence: 0.55, outputFacialTransformationMatrixes: true,
    })
  }
  return vision.ObjectDetector.createFromOptions(fileset, {
    baseOptions, canvas, runningMode: 'VIDEO', scoreThreshold: 0.25,
    categoryAllowlist: ['cell phone'], maxResults: 3,
  })
}

function faceIssue(result) {
  if (!result.faceLandmarks.length) return 'NO_FACE'
  if (result.faceLandmarks.length > 1) return 'MULTIPLE_FACES'
  const landmarks = result.faceLandmarks[0]
  const nose = landmarks[1], left = landmarks[33], right = landmarks[263]
  if (!nose || !left || !right) return null
  const offset = Math.abs(nose.x - (left.x + right.x) / 2) / Math.max(0.001, Math.abs(right.x - left.x))
  const matrix = result.facialTransformationMatrixes?.[0]?.data
  const yaw = matrix?.length >= 16 ? Math.atan2(matrix[8], Math.hypot(matrix[0], matrix[4])) * 180 / Math.PI : null
  return offset > 0.55 && (yaw === null || Math.abs(yaw) > 35) ? 'LOOKING_AWAY' : null
}

async function phoneEvidence(result, frame, capturedAt, timestamp) {
  const candidates = result.detections.flatMap((item) => {
    const category = item.categories.find((entry) => entry.categoryName === 'cell phone')
    return item.boundingBox && category ? [{ detection: item, confidence: category.score }] : []
  }).sort((a, b) => b.confidence - a.confidence)
  const best = candidates[0]
  const detection = best?.confidence >= PHONE_CONFIDENCE ? best.detection : null
  const sampleGap = lastPhoneSampleAt === null ? 0 : timestamp - lastPhoneSampleAt
  if (sampleGap > 5000) resetPhoneObservation()
  // A brief missed sample pauses confirmation instead of erasing all progress.
  // Missing time never contributes to the three seconds of positive observation.
  if (!previousPhonePositive && lastPhoneSeenAt !== null && timestamp - lastPhoneSeenAt > PHONE_MISSING_TOLERANCE_MS) resetPhoneObservation()
  lastPhoneSampleAt = timestamp
  if (detection) {
    if (previousPhonePositive) phonePositiveMs += sampleGap
    lastPhoneSeenAt = timestamp
  } else if (lastPhoneSeenAt !== null && timestamp - lastPhoneSeenAt > PHONE_MISSING_TOLERANCE_MS) {
    resetPhoneObservation()
  }
  previousPhonePositive = Boolean(detection)
  phoneDiagnostics = {
    confidence: best?.confidence ?? null, threshold: PHONE_CONFIDENCE,
    positiveMs: phonePositiveMs,
    cooldownRemainingMs: Math.max(0, 10000 - (timestamp - lastPhoneAlertAt)),
    state: !detection ? (best ? 'below-threshold' : 'not-detected') : phonePositiveMs < 3000 ? 'confirming' : timestamp - lastPhoneAlertAt < 10000 ? 'cooldown' : 'confirmed',
  }
  if (!detection) return null
  if (phonePositiveMs < 3000 || timestamp - lastPhoneAlertAt < 10000) return null

  const canvas = new OffscreenCanvas(frame.width, frame.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Evidence canvas unavailable')
  context.drawImage(frame, 0, 0)
  const fontSize = Math.max(12, Math.round(frame.width / 55))
  context.font = `${fontSize}px monospace`
  context.fillStyle = 'rgba(0,0,0,0.75)'
  context.fillRect(0, frame.height - fontSize * 2, frame.width, fontSize * 2)
  context.fillStyle = '#ffffff'
  context.fillText(new Date(capturedAt).toISOString(), 8, frame.height - fontSize * 0.6)
  const blob = await canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
  lastPhoneAlertAt = timestamp
  const category = detection.categories.find((item) => item.categoryName === 'cell phone')
  const { originX, originY, width, height } = detection.boundingBox
  return {
    blob,
    metadata: {
      model: 'efficientdet_lite0', category: 'cell phone', confidence: category.score,
      boundingBox: { originX, originY, width, height }, frameWidth: frame.width, frameHeight: frame.height,
      capturedAt: new Date(capturedAt).toISOString(), observedDurationMs: Math.min(86400000, phonePositiveMs),
    },
  }
}

self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    if (initialized || busy) return
    debug = data.debug === true
    busy = true
    try {
      fileset = await vision.FilesetResolver.forVisionTasks(new URL('./wasm', self.location.href).href)
      try { face = await createTask('face', 'GPU') }
      catch { faceDelegate = 'CPU'; face = await createTask('face', 'CPU') }
      try { phone = await createTask('phone', 'GPU') }
      catch { phoneDelegate = 'CPU'; phone = await createTask('phone', 'CPU') }
      initialized = true
      self.postMessage({ type: 'ready', faceDelegate, phoneDelegate })
    } catch (error) {
      self.postMessage({ type: 'error', message: String(error), fatal: true })
    } finally { busy = false }
    return
  }
  if (data.type !== 'frame') return
  if (busy || !initialized) { data.frame.close(); return }
  busy = true
  const started = performance.now()
  const kind = nextTask
  nextTask = kind === 'face' ? 'phone' : 'face'
  try {
    let result
    try {
      if (kind === 'face') {
        result = face.detectForVideo(data.frame, data.timestamp)
      } else {
        const input = preparePhoneFrame(data.frame)
        result = phoneResultInOriginalFrame(phone.detectForVideo(input.image, data.timestamp), input, data.frame)
      }
    } catch (error) {
      if ((kind === 'face' ? faceDelegate : phoneDelegate) === 'CPU') throw error
      if (kind === 'face') {
        face.close(); faceDelegate = 'CPU'; face = await createTask('face', 'CPU')
      } else {
        phone.close(); phoneDelegate = 'CPU'; phone = await createTask('phone', 'CPU')
      }
      // The next fresh frame is used after delegate recovery.
      resetPhoneObservation()
      self.postMessage({ type: 'result', kind, skipped: true, intervalMs })
      return
    }
    const evidence = kind === 'phone' ? await phoneEvidence(result, data.frame, data.capturedAt, data.timestamp) : null
    const duration = performance.now() - started
    intervalMs = Math.round(Math.min(1000, Math.max(250, intervalMs * 0.75 + duration * 2 * 0.25)))
    self.postMessage({
      type: 'result', kind, issue: kind === 'face' ? faceIssue(result) : null,
      evidence, intervalMs, capturedAt: data.capturedAt, inferenceMs: duration,
      diagnostics: debug && kind === 'phone' ? phoneDiagnostics : undefined,
    })
  } catch (error) {
    resetPhoneObservation()
    self.postMessage({ type: 'error', message: String(error), fatal: false })
  } finally {
    data.frame.close()
    busy = false
  }
}
