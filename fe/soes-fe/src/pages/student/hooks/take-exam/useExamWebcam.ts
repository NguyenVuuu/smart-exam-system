import { useCallback, useEffect, useState } from 'react'
import {
  getActiveExamWebcam,
  isExamWebcamStreamLive,
  requestExamWebcam,
  stopExamWebcam,
} from '../../utils/exam-webcam'

export type ExamWebcamStatus =
  | 'IDLE'
  | 'REQUESTING'
  | 'ACTIVE'
  | 'DISCONNECTED'
  | 'PERMISSION_DENIED'
  | 'BLOCKED'
  | 'UNAVAILABLE'
  | 'ERROR'

const FRAME_STALE_MS = 5_000
const FRAME_CHECK_INTERVAL_MS = 1_000

function getWebcamErrorMessage(error: unknown): string {
  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Bạn chưa cho phép trình duyệt sử dụng camera. Hãy cấp quyền camera rồi thử lại.'
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Không tìm thấy camera trên thiết bị này.'
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'Camera đang được ứng dụng khác sử dụng hoặc không thể khởi động.'
    }
  }

  if (error instanceof Error && ['WEBCAM_METADATA_TIMEOUT', 'WEBCAM_VIDEO_ERROR', 'WEBCAM_NOT_ACTIVE'].includes(error.message)) {
    return 'Camera đã được cấp quyền nhưng chưa có hình ảnh thật. Hãy kiểm tra camera rồi thử lại.'
  }

  if (error instanceof Error && error.message === 'WEBCAM_UNSUPPORTED') {
    return 'Trình duyệt này không hỗ trợ truy cập camera.'
  }

  return 'Không thể mở camera. Hãy kiểm tra thiết bị và quyền truy cập rồi thử lại.'
}

function getWebcamErrorStatus(error: unknown): ExamWebcamStatus {
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
    return 'PERMISSION_DENIED'
  }
  if (error instanceof DOMException && (error.name === 'NotReadableError' || error.name === 'TrackStartError')) {
    return 'BLOCKED'
  }
  if (error instanceof DOMException && (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError')) {
    return 'UNAVAILABLE'
  }
  return 'ERROR'
}

export function useExamWebcam(required: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(() => getActiveExamWebcam())
  const [status, setStatus] = useState<ExamWebcamStatus>(() => getActiveExamWebcam() ? 'ACTIVE' : 'IDLE')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const start = useCallback(async () => {
    setStatus('REQUESTING')
    setErrorMessage(null)

    try {
      const nextStream = await requestExamWebcam()
      setStream(nextStream)
      setStatus('ACTIVE')
      return nextStream
    } catch (error) {
      setStream(null)
      setStatus(getWebcamErrorStatus(error))
      setErrorMessage(getWebcamErrorMessage(error))
      throw error
    }
  }, [])

  const stop = useCallback(() => {
    stopExamWebcam()
    setStream(null)
    setStatus('IDLE')
  }, [])

  useEffect(() => {
    if (!required || !stream) return

    const videoTracks = stream.getVideoTracks()
    const handleTrackEnded = () => {
      setStream(null)
      setStatus('DISCONNECTED')
      setErrorMessage('Camera đã bị tắt trong lúc thi. Hệ thống đã ghi nhận sự kiện này.')
    }
    const handleTrackMuted = () => {
      setStatus('BLOCKED')
      setErrorMessage('Camera đang bị chặn hoặc không gửi được hình ảnh. Hệ thống đã ghi nhận sự kiện này.')
    }
    const handleTrackUnmuted = () => {
      if (!isExamWebcamStreamLive(stream)) return
      setStatus('ACTIVE')
      setErrorMessage(null)
    }

    videoTracks.forEach((track) => track.addEventListener('ended', handleTrackEnded))
    videoTracks.forEach((track) => track.addEventListener('mute', handleTrackMuted))
    videoTracks.forEach((track) => track.addEventListener('unmute', handleTrackUnmuted))

    return () => {
      videoTracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded))
      videoTracks.forEach((track) => track.removeEventListener('mute', handleTrackMuted))
      videoTracks.forEach((track) => track.removeEventListener('unmute', handleTrackUnmuted))
    }
  }, [required, stream])

  useEffect(() => {
    if (!required || !stream || !navigator.permissions?.query) return

    let permissionStatus: PermissionStatus | null = null
    let handlePermissionChange: (() => void) | null = null
    let cancelled = false

    navigator.permissions.query({ name: 'camera' as PermissionName })
      .then((result) => {
        if (cancelled) return
        permissionStatus = result
        handlePermissionChange = () => {
          if (result.state !== 'denied') return
          setStream(null)
          setStatus('PERMISSION_DENIED')
          setErrorMessage('Quyền camera đã bị từ chối trong lúc thi. Hệ thống đã ghi nhận sự kiện này.')
        }
        result.addEventListener('change', handlePermissionChange)
        handlePermissionChange()
      })
      .catch(() => undefined)

    return () => {
      cancelled = true
      if (permissionStatus && handlePermissionChange) {
        permissionStatus.removeEventListener('change', handlePermissionChange)
      }
    }
  }, [required, stream])

  useEffect(() => {
    if (!required || !stream) return

    const video = document.createElement('video')
    let frameCallbackId: number | null = null
    let intervalId: number | null = null
    let lastFrameAt = Date.now()
    let lastCurrentTime = 0
    let cancelled = false

    video.muted = true
    video.playsInline = true
    video.srcObject = stream

    const markFrame = () => {
      lastFrameAt = Date.now()
      if (!cancelled && isExamWebcamStreamLive(stream)) {
        setStatus('ACTIVE')
        setErrorMessage(null)
      }
    }

    const scheduleFrameCheck = () => {
      if (typeof video.requestVideoFrameCallback !== 'function') return
      frameCallbackId = video.requestVideoFrameCallback(() => {
        markFrame()
        scheduleFrameCheck()
      })
    }

    void video.play().then(scheduleFrameCheck).catch(() => undefined)

    intervalId = window.setInterval(() => {
      if (!isExamWebcamStreamLive(stream)) {
        setStream(null)
        setStatus('DISCONNECTED')
        setErrorMessage('Camera đã mất kết nối trong lúc thi. Hệ thống đã ghi nhận sự kiện này.')
        return
      }

      if (typeof video.requestVideoFrameCallback !== 'function' && video.currentTime !== lastCurrentTime) {
        lastCurrentTime = video.currentTime
        markFrame()
      }

      if (Date.now() - lastFrameAt <= FRAME_STALE_MS) return
      setStatus('BLOCKED')
      setErrorMessage('Camera đang bị chặn hoặc không có khung hình mới. Hệ thống đã ghi nhận sự kiện này.')
    }, FRAME_CHECK_INTERVAL_MS)

    return () => {
      cancelled = true
      if (frameCallbackId !== null && typeof video.cancelVideoFrameCallback === 'function') {
        video.cancelVideoFrameCallback(frameCallbackId)
      }
      if (intervalId !== null) window.clearInterval(intervalId)
      video.pause()
      video.srcObject = null
    }
  }, [required, stream])

  return {
    stream,
    status,
    errorMessage,
    isActive: !required || (status === 'ACTIVE' && isExamWebcamStreamLive(stream)),
    start,
    stop,
  }
}
