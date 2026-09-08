import { useEffect, useRef } from 'react'
import { takeExamApi, type RecordViolationPayload } from '../../api/student-take-exam.api'
import { isExamScreenShareStreamLive, type ExamScreenShareStatus } from './useExamScreenShare'

interface OpenViolationState {
  id: string
  type: 'SCREEN_SHARE_STOPPED' | 'SCREEN_PERMISSION_DENIED'
}

interface ImageCaptureLike {
  grabFrame: () => Promise<ImageBitmap>
}

type WindowWithImageCapture = Window & typeof globalThis & {
  ImageCapture?: new (track: MediaStreamTrack) => ImageCaptureLike
}

async function canvasToEvidenceFile(canvas: HTMLCanvasElement): Promise<File | null> {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.82)
  })

  return blob ? new File([blob], `screen-evidence-${Date.now()}.jpg`, { type: 'image/jpeg' }) : null
}

async function captureScreenTrackEvidence(stream: MediaStream): Promise<File | null> {
  const track = stream.getVideoTracks()[0]
  const ImageCaptureConstructor = (window as WindowWithImageCapture).ImageCapture
  if (!track || !ImageCaptureConstructor) return null

  const bitmap = await new ImageCaptureConstructor(track).grabFrame().catch(() => null)
  if (!bitmap) return null

  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return null
  }

  context.drawImage(bitmap, 0, 0)
  bitmap.close()
  return canvasToEvidenceFile(canvas)
}

async function captureScreenVideoEvidence(stream: MediaStream): Promise<File | null> {
  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = stream

  await video.play().catch(() => undefined)
  if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) {
    await new Promise<void>((resolve) => {
      const timeoutId = window.setTimeout(resolve, 800)
      video.onloadeddata = () => {
        window.clearTimeout(timeoutId)
        resolve()
      }
    })
  }

  if (video.videoWidth <= 0 || video.videoHeight <= 0) {
    video.pause()
    video.srcObject = null
    return null
  }

  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (!context) {
    video.pause()
    video.srcObject = null
    return null
  }

  context.drawImage(video, 0, 0, canvas.width, canvas.height)
  video.pause()
  video.srcObject = null

  const file = await canvasToEvidenceFile(canvas)
  return file
}

export async function captureScreenEvidence(stream: MediaStream | null): Promise<File[] | undefined> {
  if (!isExamScreenShareStreamLive(stream)) return undefined

  const file = await captureScreenTrackEvidence(stream).catch(() => null)
    ?? await captureScreenVideoEvidence(stream).catch(() => null)
  return file ? [file] : undefined
}

function issueFromScreenStatus(status: ExamScreenShareStatus): OpenViolationState['type'] | null {
  if (status === 'PERMISSION_DENIED') return 'SCREEN_PERMISSION_DENIED'
  if (status === 'STOPPED' || status === 'UNAVAILABLE' || status === 'ERROR') return 'SCREEN_SHARE_STOPPED'
  return null
}

function buildPayload(type: OpenViolationState['type']): RecordViolationPayload {
  return {
    violationType: type,
    severity: type === 'SCREEN_PERMISSION_DENIED' ? 'HIGH' : 'MEDIUM',
    description: type === 'SCREEN_PERMISSION_DENIED'
      ? 'Student denied or revoked screen sharing permission during the exam.'
      : 'Student stopped screen sharing during the exam.',
    detectedAt: new Date().toISOString(),
  }
}

export function useScreenShareViolationMonitor(input: {
  enabled: boolean
  scheduleId: string
  attemptId: string
  stream: MediaStream | null
  screenShareStatus: ExamScreenShareStatus
}) {
  const openViolationRef = useRef<OpenViolationState | null>(null)

  useEffect(() => {
    if (!input.enabled || !input.scheduleId || !input.attemptId) return

    let cancelled = false

    const closeOpenViolation = async () => {
      const openViolation = openViolationRef.current
      if (!openViolation) return
      openViolationRef.current = null
      await takeExamApi.endViolation(input.scheduleId, input.attemptId, openViolation.id, new Date().toISOString()).catch(() => undefined)
    }

    const sync = async () => {
      const issue = issueFromScreenStatus(input.screenShareStatus)
      if (!issue) {
        await closeOpenViolation()
        return
      }
      if (openViolationRef.current?.type === issue) return

      await closeOpenViolation()
      const payload = buildPayload(issue)
      const response = await takeExamApi.recordViolation(input.scheduleId, input.attemptId, payload).catch(() => null)
      if (!cancelled && response) {
        openViolationRef.current = { id: response.id, type: issue }
      }
    }

    void sync()

    return () => {
      cancelled = true
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.screenShareStatus, input.stream])
}
