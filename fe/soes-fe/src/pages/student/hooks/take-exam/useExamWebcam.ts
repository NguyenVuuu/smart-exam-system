import { useCallback, useEffect, useState } from 'react'
import {
  getActiveExamWebcam,
  requestExamWebcam,
  stopExamWebcam,
} from '../../utils/exam-webcam'

export type ExamWebcamStatus = 'IDLE' | 'REQUESTING' | 'ACTIVE' | 'DENIED' | 'UNAVAILABLE' | 'ERROR'

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

  if (error instanceof Error && error.message === 'WEBCAM_UNSUPPORTED') {
    return 'Trình duyệt này không hỗ trợ truy cập camera.'
  }

  return 'Không thể mở camera. Hãy kiểm tra thiết bị và quyền truy cập rồi thử lại.'
}

function getWebcamErrorStatus(error: unknown): ExamWebcamStatus {
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
    return 'DENIED'
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
      setStatus('ERROR')
      setErrorMessage('Camera đã bị tắt. Bạn phải mở lại camera để tiếp tục làm bài.')
    }

    videoTracks.forEach((track) => track.addEventListener('ended', handleTrackEnded))
    return () => videoTracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded))
  }, [required, stream])

  return {
    stream,
    status,
    errorMessage,
    isActive: !required || status === 'ACTIVE',
    start,
    stop,
  }
}
