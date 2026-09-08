import { useEffect, useRef } from 'react'
import { takeExamApi, type ExamViolationType, type RecordViolationPayload } from '../../api/student-take-exam.api'
import type { ExamWebcamStatus } from './useExamWebcam'
import { isExamWebcamStreamLive } from '../../utils/exam-webcam'
import type { FaceLandmarker, FaceLandmarkerResult, Matrix, NormalizedLandmark } from '@mediapipe/tasks-vision'

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

const ANALYSIS_INTERVAL_MS = 1_000
const VIOLATION_COOLDOWN_MS = 15_000
const MEDIAPIPE_WASM_URL = '/mediapipe/wasm'
const FACE_LANDMARKER_MODEL_URL = '/models/face_landmarker.task'
const FACE_LANDMARKER_NUM_FACES = 3
const FACE_YAW_THRESHOLD_DEGREES = 35
const NOSE_HORIZONTAL_OFFSET_RATIO = 0.55

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

const CAMERA_STATUS_ISSUES: WebcamIssueType[] = ['CAMERA_DISCONNECTED', 'CAMERA_PERMISSION_DENIED', 'CAMERA_BLOCKED']

let faceLandmarkerPromise: Promise<FaceLandmarker> | null = null

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

async function getFaceLandmarker(): Promise<FaceLandmarker> {
  if (!faceLandmarkerPromise) {
    faceLandmarkerPromise = import('@mediapipe/tasks-vision').then(async ({ FaceLandmarker, FilesetResolver }) => {
      const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL)
      const options = {
        baseOptions: {
          modelAssetPath: FACE_LANDMARKER_MODEL_URL,
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numFaces: FACE_LANDMARKER_NUM_FACES,
        minFaceDetectionConfidence: 0.55,
        minFacePresenceConfidence: 0.55,
        minTrackingConfidence: 0.55,
        outputFacialTransformationMatrixes: true,
      } as const

      return FaceLandmarker.createFromOptions(vision, options)
        .catch(() => FaceLandmarker.createFromOptions(vision, {
          ...options,
          baseOptions: {
            ...options.baseOptions,
            delegate: 'CPU',
          },
        }))
    })
  }

  return faceLandmarkerPromise
}

function degrees(radians: number): number {
  return radians * 180 / Math.PI
}

function getMatrixPose(matrix: Matrix | undefined): { yaw: number; pitch: number } | null {
  if (!matrix || matrix.data.length < 16) return null
  const m = matrix.data
  const yaw = degrees(Math.atan2(m[8], Math.hypot(m[0], m[4])))
  const pitch = degrees(Math.atan2(-m[9], Math.hypot(m[10], m[11])))
  return { yaw, pitch }
}

function hasLandmarkLookingAway(landmarks: NormalizedLandmark[] | undefined): boolean {
  if (!landmarks) return false
  const nose = landmarks[1]
  const leftEye = landmarks[33]
  const rightEye = landmarks[263]
  if (!nose || !leftEye || !rightEye) return false

  const eyeCenterX = (leftEye.x + rightEye.x) / 2
  const eyeDistance = Math.max(0.001, Math.abs(rightEye.x - leftEye.x))
  const horizontalOffset = Math.abs(nose.x - eyeCenterX) / eyeDistance

  return horizontalOffset > NOSE_HORIZONTAL_OFFSET_RATIO
}

function detectFaceLandmarkerIssue(result: FaceLandmarkerResult): WebcamIssueType | null {
  const faceCount = result.faceLandmarks.length
  if (faceCount === 0) return 'NO_FACE'
  if (faceCount > 1) return 'MULTIPLE_FACES'

  const isLandmarkLookingAway = hasLandmarkLookingAway(result.faceLandmarks[0])
  const pose = getMatrixPose(result.facialTransformationMatrixes[0])
  if (pose && Math.abs(pose.yaw) > FACE_YAW_THRESHOLD_DEGREES && isLandmarkLookingAway) {
    return 'LOOKING_AWAY'
  }

  return !pose && isLandmarkLookingAway ? 'LOOKING_AWAY' : null
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
    let landmarker: FaceLandmarker | null = null
    let landmarkerReady = false
    openViolationRef.current = openViolationRef.current ?? restoreOpenViolation(input.scheduleId, input.attemptId)

    if (input.stream && isExamWebcamStreamLive(input.stream)) {
      video = document.createElement('video')
      video.muted = true
      video.playsInline = true
      video.srcObject = input.stream
      void video.play().catch(() => undefined)
      void getFaceLandmarker()
        .then((result) => {
          if (cancelled) return
          landmarker = result
          landmarkerReady = true
        })
        .catch(() => {
          landmarkerReady = false
        })
    }

    const closeOpenViolation = async (endedAt: string) => {
      const openViolation = openViolationRef.current
      if (!openViolation) return
      openViolationRef.current = null
      forgetOpenViolation(input.scheduleId, input.attemptId, openViolation)
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
        evidenceFiles: CAMERA_STATUS_ISSUES.includes(type) ? undefined : await buildEvidenceFiles(video, input.stream),
      }).catch(() => null)

      if (!cancelled && response) {
        const nextOpenViolation = { id: response.id, type }
        openViolationRef.current = nextOpenViolation
        rememberOpenViolation(input.scheduleId, input.attemptId, nextOpenViolation)
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
      if (!landmarkerReady || !landmarker) return

      try {
        const faceIssue = detectFaceLandmarkerIssue(landmarker.detectForVideo(video, performance.now()))
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
      void closeOpenViolation(new Date().toISOString())
      cancelled = true
      window.clearInterval(intervalId)
      video?.pause()
      if (video) video.srcObject = null
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream, input.webcamStatus])
}
