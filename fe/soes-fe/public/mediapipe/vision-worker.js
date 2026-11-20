/* Classic worker: MediaPipe's WASM loader uses importScripts. */
let vision = null

let face = null
let phone = null
let faceDelegate = 'GPU'
let phoneDelegate = 'WASM'
let fileset = null
let busy = false
let intervalMs = 150
let phoneEpisodeActive = false
let initialized = false
let debug = false
let mode = null
let phoneDiagnostics = null
let lastFaceEvidenceIssue = null
let lastFaceEvidenceAt = -Infinity
let faceCandidateIssue = null
let faceCandidateStartedAt = 0
const FACE_CONFIRM_MS = { NO_FACE: 3000, MULTIPLE_FACES: 1000, LOOKING_AWAY: 1500 }

async function createFaceTask(delegate) {
  const baseOptions = {
    modelAssetPath: new URL('../models/face_landmarker.task', self.location.href).href,
    delegate,
  }
  // Each task owns its WebGL context; inference is still serialized in this worker.
  const canvas = new OffscreenCanvas(1, 1)
  return vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions, canvas, runningMode: 'VIDEO', numFaces: 3,
    minFaceDetectionConfidence: 0.55, minFacePresenceConfidence: 0.55,
    minTrackingConfidence: 0.55, outputFacialTransformationMatrixes: true,
  })
}

function confirmedFaceIssue(result, timestamp) {
  const candidate = FaceIssue.detect(result)
  if (!candidate) {
    faceCandidateIssue = null
    return null
  }
  if (candidate !== faceCandidateIssue) {
    faceCandidateIssue = candidate
    faceCandidateStartedAt = timestamp
  }
  return timestamp - faceCandidateStartedAt >= FACE_CONFIRM_MS[candidate] ? candidate : null
}

async function captureEvidenceFrame(frame, capturedAt, phoneBox = null) {
  const canvas = new OffscreenCanvas(frame.width, frame.height)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Evidence canvas unavailable')
  context.drawImage(frame, 0, 0)
  if (phoneBox) {
    context.strokeStyle = '#facc15'
    context.lineWidth = Math.max(3, Math.round(frame.width / 180))
    context.strokeRect(phoneBox.originX, phoneBox.originY, phoneBox.width, phoneBox.height)
  }
  const fontSize = Math.max(12, Math.round(frame.width / 55))
  context.font = `${fontSize}px monospace`
  context.fillStyle = 'rgba(0,0,0,0.75)'
  context.fillRect(0, frame.height - fontSize * 2, frame.width, fontSize * 2)
  context.fillStyle = '#ffffff'
  context.fillText(new Date(capturedAt).toISOString(), 8, frame.height - fontSize * 0.6)
  return canvas.convertToBlob({ type: 'image/jpeg', quality: 0.85 })
}

async function phoneEvidence(result, frame, capturedAt) {
  const candidates = result.detections.flatMap((item) => {
    const category = item.categories[0]
    return item.boundingBox && category ? [{ detection: item, confidence: category.score }] : []
  }).sort((a, b) => b.confidence - a.confidence)
  const best = candidates[0]
  const detection = best?.confidence >= PhoneScan.minConfidence || best?.detection.confirmed ? best.detection : null
  phoneDiagnostics = {
    confidence: best?.confidence ?? null, threshold: PhoneScan.minConfidence,
    positiveMs: 0,
    cooldownRemainingMs: 0,
    state: !detection ? (best ? 'below-threshold' : 'not-detected') : phoneEpisodeActive ? 'same-appearance' : 'first-frame',
  }
  if (!detection) {
    // A complete phone scan without a match ends the current appearance.
    // The next appearance can be reported immediately, even within 10 seconds.
    phoneEpisodeActive = false
    return null
  }
  if (phoneEpisodeActive) return null

  const blob = await captureEvidenceFrame(frame, capturedAt, detection.boundingBox)
  phoneEpisodeActive = true
  const category = detection.categories[0]
  const { originX, originY, width, height } = detection.boundingBox
  return {
    blob,
    metadata: {
      model: detection.model ?? 'yolo11n-devices', category: category.categoryName, confidence: category.score,
      boundingBox: { originX, originY, width, height }, frameWidth: frame.width, frameHeight: frame.height,
      capturedAt: new Date(capturedAt).toISOString(), observedDurationMs: 0,
    },
  }
}

self.onmessage = async ({ data }) => {
  if (data.type === 'phone-upload-failed') {
    phoneEpisodeActive = false
    return
  }
  if (data.type === 'init') {
    if (initialized || busy) return
    debug = data.debug === true
    mode = data.mode
    if (mode !== 'face' && mode !== 'phone') {
      self.postMessage({ type: 'error', message: 'Vision worker mode is required', fatal: true })
      return
    }
    busy = true
    try {
      if (mode === 'face') {
        importScripts('./vision_bundle.js', './face-issue.js')
        vision = Vision
        fileset = await vision.FilesetResolver.forVisionTasks(new URL('./wasm', self.location.href).href)
        try { face = await createFaceTask('GPU') }
        catch { faceDelegate = 'CPU'; face = await createFaceTask('CPU') }
      }
      if (mode === 'phone') {
        importScripts('../yolo/ort.min.js', './phone-yolo.js', './phone-frames.js', './phone-scan.js')
        phone = await PhoneYolo.create()
        phoneDelegate = phone.delegate
      }
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
  const kind = mode
  try {
    let result
    try {
      if (kind === 'face') {
        result = face.detectForVideo(data.frame, data.timestamp)
      } else {
        result = await PhoneScan.full(phone, data.frame, data.timestamp)
      }
    } catch (error) {
      if (kind === 'phone' || faceDelegate === 'CPU') throw error
      if (kind === 'face') {
        face.close(); faceDelegate = 'CPU'; face = await createFaceTask('CPU')
      }
      // The next fresh frame is used after delegate recovery.
      self.postMessage({ type: 'result', kind, skipped: true, intervalMs })
      return
    }
    const issue = kind === 'face' ? confirmedFaceIssue(result, data.timestamp) : null
    let faceEvidence = null
    if (kind === 'face') {
      if (!issue) lastFaceEvidenceIssue = null
      else if (issue !== lastFaceEvidenceIssue || data.timestamp - lastFaceEvidenceAt >= 15000) {
        faceEvidence = await captureEvidenceFrame(data.frame, data.capturedAt).catch(() => null)
        lastFaceEvidenceIssue = issue
        lastFaceEvidenceAt = data.timestamp
      }
    }
    const evidence = kind === 'phone' ? await phoneEvidence(result, data.frame, data.capturedAt) : null
    const duration = performance.now() - started
    intervalMs = Math.round(Math.min(150, Math.max(80, intervalMs * 0.75 + duration * 0.25)))
    self.postMessage({
      type: 'result', kind, issue,
      evidence, faceEvidence, intervalMs, capturedAt: data.capturedAt, inferenceMs: duration,
      diagnostics: debug && kind === 'phone' ? phoneDiagnostics : undefined,
    })
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error), fatal: false })
  } finally {
    data.frame.close()
    busy = false
  }
}
