import { useEffect, useRef } from 'react'
import { takeExamApi, type ExamViolationType, type RecordViolationPayload } from '../../api/student-take-exam.api'
import type { ExamWebcamStatus } from './useExamWebcam'
import { isExamWebcamStreamLive } from '../../utils/exam-webcam'

type WebcamIssueType = Extract<
  ExamViolationType,
  'CAMERA_DISCONNECTED' | 'CAMERA_PERMISSION_DENIED' | 'CAMERA_BLOCKED' | 'NO_FACE' | 'MULTIPLE_FACES'
>

interface FaceDetectorLike {
  detect: (source: CanvasImageSource) => Promise<Array<unknown>>
}

interface ImageCaptureLike {
  grabFrame: () => Promise<ImageBitmap>
}

declare global {
  interface Window {
    FaceDetector?: new (options?: { fastMode?: boolean; maxDetectedFaces?: number }) => FaceDetectorLike
    ImageCapture?: new (track: MediaStreamTrack) => ImageCaptureLike
  }
}

interface OpenViolationState {
  id: string
  type: WebcamIssueType
}

const ANALYSIS_INTERVAL_MS = 1_000
const VIOLATION_COOLDOWN_MS = 15_000
const FALLBACK_SAMPLE_SIZE = 96
const FALLBACK_MIN_FACE_SKIN_PIXELS = 36
const FALLBACK_MIN_FACE_SKIN_RATIO = 0.006
const THRESHOLDS_MS: Record<WebcamIssueType, number> = {
  CAMERA_DISCONNECTED: 0,
  CAMERA_PERMISSION_DENIED: 0,
  CAMERA_BLOCKED: 0,
  NO_FACE: 5_000,
  MULTIPLE_FACES: 3_000,
}

const SEVERITY: Record<WebcamIssueType, RecordViolationPayload['severity']> = {
  CAMERA_DISCONNECTED: 'MEDIUM',
  CAMERA_PERMISSION_DENIED: 'HIGH',
  CAMERA_BLOCKED: 'HIGH',
  NO_FACE: 'MEDIUM',
  MULTIPLE_FACES: 'HIGH',
}

const DESCRIPTION: Record<WebcamIssueType, string> = {
  CAMERA_DISCONNECTED: 'Camera was disconnected or stopped during the exam.',
  CAMERA_PERMISSION_DENIED: 'Webcam permission was denied or revoked during the exam.',
  CAMERA_BLOCKED: 'Camera is blocked, muted, or not producing fresh frames.',
  NO_FACE: 'No face was detected for longer than the configured threshold.',
  MULTIPLE_FACES: 'Multiple faces were detected for longer than the configured threshold.',
}

function issueFromWebcamStatus(status: ExamWebcamStatus): WebcamIssueType | null {
  if (status === 'DISCONNECTED' || status === 'UNAVAILABLE' || status === 'ERROR') return 'CAMERA_DISCONNECTED'
  if (status === 'PERMISSION_DENIED') return 'CAMERA_PERMISSION_DENIED'
  if (status === 'BLOCKED') return 'CAMERA_BLOCKED'
  return null
}

async function canvasToEvidenceFile(canvas: HTMLCanvasElement): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82)
  })

  return blob ? new File([blob], `webcam-evidence-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null
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
  if (!context) return null

  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvasToEvidenceFile(canvas)
}

async function buildEvidenceFiles(video: HTMLVideoElement | null, stream: MediaStream | null): Promise<File[] | undefined> {
  const snapshot = await captureVideoEvidence(video).catch(() => null)
    ?? await captureTrackEvidence(stream).catch(() => null)
  return snapshot ? [snapshot] : undefined
}

function isLikelySkinPixel(r: number, g: number, b: number): boolean {
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const y = 0.299 * r + 0.587 * g + 0.114 * b
  const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
  const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b

  return y > 45
    && max - min > 12
    && cb >= 77
    && cb <= 135
    && cr >= 133
    && cr <= 180
    && r > 60
    && g > 35
    && b > 15
}

function findSkinComponents(skinMask: Uint8Array): number[] {
  const visited = new Uint8Array(skinMask.length)
  const componentSizes: number[] = []
  const queue: number[] = []

  for (let start = 0; start < skinMask.length; start += 1) {
    if (!skinMask[start] || visited[start]) continue

    let size = 0
    visited[start] = 1
    queue.push(start)

    while (queue.length > 0) {
      const current = queue.pop()!
      size += 1
      const x = current % FALLBACK_SAMPLE_SIZE
      const y = Math.floor(current / FALLBACK_SAMPLE_SIZE)
      const neighbors = [
        x > 0 ? current - 1 : -1,
        x < FALLBACK_SAMPLE_SIZE - 1 ? current + 1 : -1,
        y > 0 ? current - FALLBACK_SAMPLE_SIZE : -1,
        y < FALLBACK_SAMPLE_SIZE - 1 ? current + FALLBACK_SAMPLE_SIZE : -1,
      ]

      for (const next of neighbors) {
        if (next < 0 || !skinMask[next] || visited[next]) continue
        visited[next] = 1
        queue.push(next)
      }
    }

    componentSizes.push(size)
  }

  return componentSizes.sort((a, b) => b - a)
}

function detectFallbackFaceIssue(video: HTMLVideoElement, canvas: HTMLCanvasElement): WebcamIssueType | null {
  const width = video.videoWidth
  const height = video.videoHeight
  if (width <= 0 || height <= 0) return null

  canvas.width = FALLBACK_SAMPLE_SIZE
  canvas.height = FALLBACK_SAMPLE_SIZE

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return null

  context.drawImage(video, 0, 0, FALLBACK_SAMPLE_SIZE, FALLBACK_SAMPLE_SIZE)
  const { data } = context.getImageData(0, 0, FALLBACK_SAMPLE_SIZE, FALLBACK_SAMPLE_SIZE)
  const skinMask = new Uint8Array(FALLBACK_SAMPLE_SIZE * FALLBACK_SAMPLE_SIZE)

  let skinPixels = 0
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index]
    const g = data[index + 1]
    const b = data[index + 2]
    if (isLikelySkinPixel(r, g, b)) {
      skinPixels += 1
      skinMask[index / 4] = 1
    }
  }

  const totalPixels = FALLBACK_SAMPLE_SIZE * FALLBACK_SAMPLE_SIZE
  const skinRatio = skinPixels / totalPixels
  const components = findSkinComponents(skinMask)
  const faceLikeComponents = components.filter((size) => size >= FALLBACK_MIN_FACE_SKIN_PIXELS)

  if (skinRatio < FALLBACK_MIN_FACE_SKIN_RATIO || faceLikeComponents.length === 0) return 'NO_FACE'
  return null
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

  useEffect(() => {
    if (!input.enabled || !input.scheduleId || !input.attemptId) return

    let cancelled = false
    let video: HTMLVideoElement | null = null
    let detector: FaceDetectorLike | null = null
    const fallbackCanvas = document.createElement('canvas')

    if (input.stream && isExamWebcamStreamLive(input.stream)) {
      video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.srcObject = input.stream
      void video.play().catch(() => undefined)
      if (window.FaceDetector) {
        detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 3 })
      }
    }

    const closeOpenViolation = async (endedAt: string) => {
      const openViolation = openViolationRef.current
      if (!openViolation) return
      openViolationRef.current = null
      await takeExamApi.endViolation(input.scheduleId, input.attemptId, openViolation.id, endedAt).catch(() => undefined)
    }

    const openViolation = async (type: WebcamIssueType, observedAt: number) => {
      if (openViolationRef.current?.type === type) return
      const lastCreatedAt = lastCreatedAtRef.current[type] ?? 0
      if (observedAt - lastCreatedAt < VIOLATION_COOLDOWN_MS) return

      if (openViolationRef.current) {
        await closeOpenViolation(new Date(observedAt).toISOString())
      }

      lastCreatedAtRef.current[type] = observedAt
      const response = await takeExamApi.recordViolation(input.scheduleId, input.attemptId, {
        violationType: type,
        severity: SEVERITY[type],
        description: DESCRIPTION[type],
        detectedAt: new Date(observedAt).toISOString(),
        evidenceFiles: await buildEvidenceFiles(video, input.stream),
      }).catch(() => null)

      if (!cancelled && response) {
        openViolationRef.current = { id: response.id, type }
      }
    }

    const observeIssue = async (type: WebcamIssueType | null, observedAt: number) => {
      if (!type) {
        issueStartedAtRef.current = {}
        await closeOpenViolation(new Date(observedAt).toISOString())
        return
      }

      const startedAt = issueStartedAtRef.current[type] ?? observedAt
      issueStartedAtRef.current[type] = startedAt
      if (observedAt - startedAt >= THRESHOLDS_MS[type]) {
        await openViolation(type, startedAt)
      }
    }

    const tick = async () => {
      const statusIssue = issueFromWebcamStatus(input.webcamStatus)
      if (statusIssue) {
        await observeIssue(statusIssue, Date.now())
        return
      }

      if (!video || video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
        await observeIssue(null, Date.now())
        return
      }

      try {
        let faceIssue: WebcamIssueType | null = null
        if (detector) {
          const faces = await detector.detect(video)
          faceIssue = faces.length === 0
            ? 'NO_FACE'
            : faces.length > 1
              ? 'MULTIPLE_FACES'
              : null
        } else {
          faceIssue = detectFallbackFaceIssue(video, fallbackCanvas)
        }
        await observeIssue(faceIssue, Date.now())
      } catch {
        await observeIssue(null, Date.now())
      }
    }

    const intervalId = window.setInterval(() => {
      void tick()
    }, ANALYSIS_INTERVAL_MS)

    void tick()

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
      video?.pause()
      if (video) video.srcObject = null
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream, input.webcamStatus])
}
