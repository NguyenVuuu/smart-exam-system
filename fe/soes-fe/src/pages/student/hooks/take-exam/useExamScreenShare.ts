import { useCallback, useEffect, useState } from 'react'

export type ExamScreenShareStatus =
  | 'IDLE'
  | 'REQUESTING'
  | 'ACTIVE'
  | 'STOPPED'
  | 'PERMISSION_DENIED'
  | 'INVALID_SURFACE'
  | 'UNAVAILABLE'
  | 'ERROR'

let activeExamScreenShareStream: MediaStream | null = null

export function isExamScreenShareStreamLive(stream: MediaStream | null): stream is MediaStream {
  const track = stream?.getVideoTracks()[0]
  return Boolean(track && track.readyState === 'live' && track.enabled && track.getSettings().displaySurface === 'monitor')
}

export function getActiveExamScreenShareStream() {
  return isExamScreenShareStreamLive(activeExamScreenShareStream) ? activeExamScreenShareStream : null
}

export function stopActiveExamScreenShareStream() {
  activeExamScreenShareStream?.getTracks().forEach((track) => track.stop())
  activeExamScreenShareStream = null
}

function getScreenShareErrorStatus(error: unknown): ExamScreenShareStatus {
  if (error instanceof Error && error.message === 'SCREEN_SHARE_MUST_BE_MONITOR') {
    return 'INVALID_SURFACE'
  }
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
    return 'PERMISSION_DENIED'
  }
  if (error instanceof DOMException && (error.name === 'NotFoundError' || error.name === 'NotSupportedError')) {
    return 'UNAVAILABLE'
  }
  return 'ERROR'
}

function getScreenShareErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message === 'SCREEN_SHARE_MUST_BE_MONITOR') {
    return 'Bạn phải chia sẻ toàn màn hình mới được vào làm bài. Vui lòng chọn Toàn bộ màn hình/Entire screen, không chọn cửa sổ hoặc tab.'
  }
  if (error instanceof DOMException && (error.name === 'NotAllowedError' || error.name === 'SecurityError')) {
    return 'Bạn chưa cho phép trình duyệt chia sẻ màn hình.'
  }
  if (error instanceof DOMException && (error.name === 'NotFoundError' || error.name === 'NotSupportedError')) {
    return 'Trình duyệt hoặc thiết bị này không hỗ trợ chia sẻ màn hình.'
  }
  return 'Không thể mở chia sẻ màn hình. Hãy kiểm tra trình duyệt và thử lại.'
}

function isWholeScreenShare(stream: MediaStream) {
  const track = stream.getVideoTracks()[0]
  return track?.getSettings().displaySurface === 'monitor'
}

export function useExamScreenShare(required: boolean) {
  const [stream, setStream] = useState<MediaStream | null>(() => getActiveExamScreenShareStream())
  const [status, setStatus] = useState<ExamScreenShareStatus>(() => getActiveExamScreenShareStream() ? 'ACTIVE' : 'IDLE')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const stop = useCallback(() => {
    setStream((current) => {
      current?.getTracks().forEach((track) => track.stop())
      if (current === activeExamScreenShareStream) activeExamScreenShareStream = null
      return null
    })
    setStatus((current) => current === 'ACTIVE' ? 'STOPPED' : current)
  }, [])

  const start = useCallback(async () => {
    const activeStream = getActiveExamScreenShareStream()
    if (activeStream) {
      setStream(activeStream)
      setStatus('ACTIVE')
      setErrorMessage(null)
      return activeStream
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setStream(null)
      setStatus('UNAVAILABLE')
      setErrorMessage('Trình duyệt này không hỗ trợ chia sẻ màn hình.')
      throw new Error('SCREEN_SHARE_UNSUPPORTED')
    }

    setStatus('REQUESTING')
    setErrorMessage(null)

    try {
      const nextStream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: 'monitor' } as MediaTrackConstraints,
        audio: false,
      })
      if (!isWholeScreenShare(nextStream)) {
        nextStream.getTracks().forEach((track) => track.stop())
        setStream(null)
        setStatus('INVALID_SURFACE')
        setErrorMessage('Bạn phải chia sẻ toàn màn hình mới được vào làm bài. Vui lòng chọn Toàn bộ màn hình/Entire screen, không chọn cửa sổ hoặc tab.')
        throw new Error('SCREEN_SHARE_MUST_BE_MONITOR')
      }
      activeExamScreenShareStream = nextStream
      setStream(nextStream)
      setStatus('ACTIVE')
      return nextStream
    } catch (error) {
      setStream(null)
      setStatus(getScreenShareErrorStatus(error))
      setErrorMessage(getScreenShareErrorMessage(error))
      throw error
    }
  }, [])

  useEffect(() => {
    if (!required || !stream) return

    const videoTracks = stream.getVideoTracks()
    const handleTrackEnded = () => {
      if (stream === activeExamScreenShareStream) activeExamScreenShareStream = null
      setStream(null)
      setStatus('STOPPED')
      setErrorMessage('Bạn đã dừng chia sẻ màn hình. Sự kiện này đã được ghi nhận để giảng viên xem xét.')
    }

    videoTracks.forEach((track) => track.addEventListener('ended', handleTrackEnded))
    return () => {
      videoTracks.forEach((track) => track.removeEventListener('ended', handleTrackEnded))
    }
  }, [required, stream])

  return {
    stream,
    status,
    errorMessage,
    isActive: !required || isExamScreenShareStreamLive(stream),
    start,
    stop,
  }
}
