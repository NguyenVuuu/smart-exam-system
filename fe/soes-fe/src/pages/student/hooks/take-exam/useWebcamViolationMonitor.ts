import { useEffect, useRef, useState } from 'react'
import { takeExamApi, type ExamViolationType, type RecordViolationPayload, type PhoneDetectionMetadata } from '../../api/student-take-exam.api'
import type { ExamWebcamStatus } from './useExamWebcam'
import { captureExamWebcamSnapshot, isExamWebcamStreamLive } from '../../utils/exam-webcam'

type WebcamIssueType = Extract<
  ExamViolationType,
  'CAMERA_DISCONNECTED' | 'CAMERA_PERMISSION_DENIED' | 'CAMERA_BLOCKED' | 'NO_FACE' | 'MULTIPLE_FACES' | 'LOOKING_AWAY'
>

interface ImageCaptureLike {
  grabFrame: () => Promise<ImageBitmap>
}

declare global {
  interface Window {
    ImageCapture?: new (track: MediaStreamTrack) => ImageCaptureLike
  }
}

interface OpenViolationState {
  id: string
  type: WebcamIssueType
}

function openViolationStorageKey(scheduleId: string, attemptId: string, type: WebcamIssueType) {
  return `soes:webcam-violation:${scheduleId}:${attemptId}:${type}`
}

function rememberOpenViolation(scheduleId: string, attemptId: string, violation: OpenViolationState) {
  window.localStorage.setItem(openViolationStorageKey(scheduleId, attemptId, violation.type), violation.id)
}

function forgetOpenViolation(scheduleId: string, attemptId: string, violation: OpenViolationState) {
  window.localStorage.removeItem(openViolationStorageKey(scheduleId, attemptId, violation.type))
}

function restoreOpenViolation(scheduleId: string, attemptId: string): OpenViolationState | null {
  const types: WebcamIssueType[] = ['CAMERA_DISCONNECTED', 'CAMERA_PERMISSION_DENIED', 'CAMERA_BLOCKED', 'NO_FACE', 'MULTIPLE_FACES', 'LOOKING_AWAY']
  for (const type of types) {
    const id = window.localStorage.getItem(openViolationStorageKey(scheduleId, attemptId, type))
    if (id) return { id, type }
  }
  return null
}

const VIOLATION_COOLDOWN_MS = 15_000

const THRESHOLDS_MS: Record<WebcamIssueType, number> = {
  CAMERA_DISCONNECTED: 0,
  CAMERA_PERMISSION_DENIED: 0,
  CAMERA_BLOCKED: 0,
  NO_FACE: 5_000,
  MULTIPLE_FACES: 3_000,
  LOOKING_AWAY: 4_000,
}

const SEVERITY: Record<WebcamIssueType, RecordViolationPayload['severity']> = {
  CAMERA_DISCONNECTED: 'MEDIUM',
  CAMERA_PERMISSION_DENIED: 'HIGH',
  CAMERA_BLOCKED: 'HIGH',
  NO_FACE: 'MEDIUM',
  MULTIPLE_FACES: 'HIGH',
  LOOKING_AWAY: 'MEDIUM',
}

const DESCRIPTION: Record<WebcamIssueType, string> = {
  CAMERA_DISCONNECTED: 'Camera was disconnected or stopped during the exam.',
  CAMERA_PERMISSION_DENIED: 'Webcam permission was denied or revoked during the exam.',
  CAMERA_BLOCKED: 'Camera is blocked, muted, or not producing fresh frames.',
  NO_FACE: 'No face was detected for longer than the configured threshold.',
  MULTIPLE_FACES: 'Multiple faces were detected for longer than the configured threshold.',
  LOOKING_AWAY: 'Student face direction moved away from the exam screen for longer than the configured threshold.',
}

function issueFromWebcamStatus(status: ExamWebcamStatus): WebcamIssueType | null {
  if (status === 'DISCONNECTED' || status === 'UNAVAILABLE' || status === 'ERROR') return 'CAMERA_DISCONNECTED'
  if (status === 'PERMISSION_DENIED') return 'CAMERA_PERMISSION_DENIED'
  if (status === 'BLOCKED') return 'CAMERA_BLOCKED'
  return null
}

async function canvasToEvidenceFile(canvas: HTMLCanvasElement): Promise<File | null> {
  const capturedAt = Date.now()
  const context = canvas.getContext('2d')
  if (context) {
    const size = Math.max(12, Math.round(canvas.width / 55))
    context.font = `${size}px monospace`
    context.fillStyle = 'rgba(0,0,0,0.75)'
    context.fillRect(0, canvas.height - size * 2, canvas.width, size * 2)
    context.fillStyle = '#ffffff'
    context.fillText(new Date(capturedAt).toISOString(), 8, canvas.height - size * 0.6)
  }
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82)
  })

  return blob ? new File([blob], `webcam-evidence-${capturedAt}.jpg`, { type: 'image/jpeg' }) : null
}

async function captureVideoEvidence(video: HTMLVideoElement | null): Promise<File | null> {
  if (!video || video.videoWidth <= 0 || video.videoHeight <= 0) return null
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) return null

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  return canvasToEvidenceFile(canvas)
}

async function captureTrackEvidence(stream: MediaStream | null): Promise<File | null> {
  const track = stream?.getVideoTracks()[0]
  if (!track || !window.ImageCapture) return null

  const bitmap = await new window.ImageCapture(track).grabFrame().catch(() => null)
  if (!bitmap) return null

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  try {
    if (!context) return null
    context.drawImage(bitmap, 0, 0)
  } finally { bitmap.close() }
  return canvasToEvidenceFile(canvas)
}

async function buildEvidenceFiles(video: HTMLVideoElement | null, stream: MediaStream | null): Promise<File[] | undefined> {
  const snapshot = await captureVideoEvidence(video).catch(() => null)
    ?? await captureTrackEvidence(stream).catch(() => null)
    ?? await captureExamWebcamSnapshot().catch(() => null)
  return snapshot ? [snapshot] : undefined
}

interface VisionMessage {
  type: 'ready' | 'result' | 'error'
  kind?: 'face' | 'phone'
  issue?: WebcamIssueType | null
  skipped?: boolean
  fatal?: boolean
  message?: string
  intervalMs?: number
  capturedAt?: number
  evidence?: { blob: Blob; metadata: PhoneDetectionMetadata } | null
  diagnostics?: { confidence: number | null; threshold: number; positiveMs: number; cooldownRemainingMs: number; state: string }
}

export function useWebcamViolationMonitor(input: {
  enabled: boolean
  scheduleId: string
  attemptId: string
  stream: MediaStream | null
  webcamStatus: ExamWebcamStatus
}) {
  const openViolationRef = useRef<OpenViolationState | null>(null)
  const issueStartedAtRef = useRef<Partial<Record<WebcamIssueType, number>>>({})
  const lastCreatedAtRef = useRef<Partial<Record<WebcamIssueType, number>>>({})
  const [visionError, setVisionError] = useState<string | null>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const phoneUploadRef = useRef(false)
  const lastPhoneCreatedAtRef = useRef(0)
  const attemptKeyRef = useRef('')

  useEffect(() => {
    if (!input.enabled || !input.scheduleId || !input.attemptId) return

    let cancelled = false
    let video: HTMLVideoElement | null = null
    let worker: Worker | null = null
    let ready = false
    let busy = false
    let intervalMs = 250
    let timer: number | undefined
    let watchdog: number | undefined
    let lastVideoTime = -1
    let observingFace = false
    let lastFaceObservedAt = 0
    let visionDebug = false
    try { visionDebug = window.localStorage.getItem('soes:vision-debug') === '1' } catch { /* Storage may be unavailable. */ }
    const attemptKey = `${input.scheduleId}:${input.attemptId}`
    if (attemptKeyRef.current !== attemptKey) {
      attemptKeyRef.current = attemptKey
      openViolationRef.current = null
      lastCreatedAtRef.current = {}
      lastPhoneCreatedAtRef.current = 0
    }
    issueStartedAtRef.current = {}
    openViolationRef.current = openViolationRef.current ?? restoreOpenViolation(input.scheduleId, input.attemptId)

    if (input.stream && isExamWebcamStreamLive(input.stream)) {
      video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.srcObject = input.stream
      void video.play().catch(() => undefined)
    }

    const closeOpenViolation = async (endedAt: string) => {
      const openViolation = openViolationRef.current
      if (!openViolation) return
      openViolationRef.current = null
      forgetOpenViolation(input.scheduleId, input.attemptId, openViolation)
      await takeExamApi.endViolation(input.scheduleId, input.attemptId, openViolation.id, endedAt).catch(() => undefined)
    }

    const openViolation = async (type: WebcamIssueType, observedAt: number) => {
      if (cancelled) return
      if (openViolationRef.current?.type === type) return
      const lastCreatedAt = lastCreatedAtRef.current[type] ?? 0
      if (Date.now() - lastCreatedAt < VIOLATION_COOLDOWN_MS) return

      if (openViolationRef.current) {
        await closeOpenViolation(new Date(observedAt).toISOString())
      }

      const evidenceFiles = await buildEvidenceFiles(video, input.stream)
      if (cancelled) return
      lastCreatedAtRef.current[type] = Date.now()
      const response = await takeExamApi.recordViolation(input.scheduleId, input.attemptId, {
        violationType: type,
        severity: SEVERITY[type],
        description: DESCRIPTION[type],
        detectedAt: new Date(observedAt).toISOString(),
        evidenceFiles,
      }).catch(() => null)

      if (!cancelled && response) {
        const nextOpenViolation = { id: response.id, type }
        openViolationRef.current = nextOpenViolation
        rememberOpenViolation(input.scheduleId, input.attemptId, nextOpenViolation)
      } else if (response) {
        void takeExamApi.endViolation(input.scheduleId, input.attemptId, response.id, new Date().toISOString()).catch(() => undefined)
      }
    }

    const observeIssue = async (type: WebcamIssueType | null, observedAt: number) => {
      if (!type) {
        issueStartedAtRef.current = {}
        await closeOpenViolation(new Date(observedAt).toISOString())
        return
      }

      const startedAt = issueStartedAtRef.current[type] ?? observedAt
      issueStartedAtRef.current = { [type]: startedAt }
      if (observedAt - startedAt >= THRESHOLDS_MS[type]) {
        await openViolation(type, startedAt)
      }
    }

    const schedule = () => {
      if (!cancelled) timer = window.setTimeout(() => { void tick() }, intervalMs)
    }

    const observeFace = async (type: WebcamIssueType | null, observedAt: number) => {
      if (cancelled || observingFace) return
      if (observedAt - lastFaceObservedAt > 5000) issueStartedAtRef.current = {}
      lastFaceObservedAt = observedAt
      observingFace = true
      try { await observeIssue(type, observedAt) }
      finally { observingFace = false }
    }

    const recordPhone = async (evidence: NonNullable<VisionMessage['evidence']>) => {
      const capturedAt = Date.parse(evidence.metadata.capturedAt)
      if (cancelled || phoneUploadRef.current || capturedAt - lastPhoneCreatedAtRef.current < 10_000) return
      phoneUploadRef.current = true
      lastPhoneCreatedAtRef.current = capturedAt
      try {
        const response = await takeExamApi.recordViolation(input.scheduleId, input.attemptId, {
          violationType: 'PHONE_DETECTED', severity: 'MEDIUM',
          description: 'Possible phone detected. Evidence requires teacher review; this is not a conclusion of misconduct.',
          detectedAt: evidence.metadata.capturedAt,
          metadata: evidence.metadata,
          evidenceFiles: [new File([evidence.blob], `phone-${Date.parse(evidence.metadata.capturedAt)}.jpg`, { type: 'image/jpeg' })],
        })
        if (visionDebug) console.info('[exam-vision] phone event saved', { id: response.id })
        if (!cancelled) setUploadError(null)
      } catch (error) {
        if (visionDebug) console.error('[exam-vision] phone upload failed', error)
        if (!cancelled) setUploadError('Không gửi được ảnh bằng chứng. Hệ thống sẽ thử lại khi có sự kiện tiếp theo.')
      } finally { phoneUploadRef.current = false }
    }

    const failWorker = () => {
      const wasBusy = busy
      ready = false
      busy = false
      window.clearTimeout(watchdog)
      worker?.terminate()
      worker = null
      if (wasBusy) schedule()
      if (!cancelled) setVisionError('Nhận diện camera tạm ngừng. Hãy báo giảng viên; chia sẻ camera vẫn hoạt động.')
    }

    if (video) {
      try {
        worker = new Worker('/mediapipe/vision-worker.js', { name: 'exam-vision' })
        worker.onerror = failWorker
        worker.onmessage = ({ data }: MessageEvent<VisionMessage>) => {
          if (cancelled) return
          if (visionDebug && data.diagnostics) console.info('[exam-vision] phone', data.diagnostics)
          if (visionDebug && data.type === 'error') console.error('[exam-vision] worker', data.message)
          if (visionDebug && data.type === 'ready') console.info('[exam-vision] ready')
          window.clearTimeout(watchdog)
          if (data.type === 'ready') {
            ready = true
            setVisionError(null)
            return
          }
          if (data.type === 'error' && data.fatal) { failWorker(); return }
          try {
            if (data.type === 'error') {
              issueStartedAtRef.current = {}
              setVisionError('Nhận diện camera gặp lỗi tạm thời; hệ thống đang thử lại.')
            } else {
              intervalMs = data.intervalMs ?? intervalMs
              if (!data.skipped) {
                setVisionError(null)
                if (data.kind === 'face') void observeFace(data.issue ?? null, data.capturedAt ?? Date.now())
                if (data.evidence) void recordPhone(data.evidence)
              }
            }
          } finally {
            busy = false
            schedule()
          }
        }
        watchdog = window.setTimeout(failWorker, 60_000)
        worker.postMessage({ type: 'init', debug: visionDebug })
      } catch { failWorker() }
    }

    const tick = async () => {
      if (cancelled || busy) return
      const statusIssue = issueFromWebcamStatus(input.webcamStatus)
      if (statusIssue) {
        void observeFace(statusIssue, Date.now())
        schedule()
        return
      }

      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        issueStartedAtRef.current = {}
        schedule()
        return
      }
      if (!ready || !worker || video.currentTime === lastVideoTime) { schedule(); return }

      busy = true
      let frame: ImageBitmap | null = null
      try {
        const capturedAt = Date.now()
        const timestamp = performance.now()
        lastVideoTime = video.currentTime
        frame = await createImageBitmap(video)
        if (cancelled) { frame.close(); return }
        worker.postMessage({ type: 'frame', frame, capturedAt, timestamp }, [frame])
        watchdog = window.setTimeout(failWorker, 15_000)
      } catch {
        busy = false
        issueStartedAtRef.current = {}
        if (!cancelled) setVisionError('Không đọc được khung hình camera để nhận diện.')
        schedule()
      } finally { frame?.close() }
    }

    void tick()

    return () => {
      cancelled = true
      void closeOpenViolation(new Date().toISOString())
      window.clearTimeout(timer)
      window.clearTimeout(watchdog)
      worker?.terminate()
      video?.pause()
      if (video) video.srcObject = null
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream, input.webcamStatus])
  return { visionError: input.enabled ? visionError ?? uploadError : null }
}
