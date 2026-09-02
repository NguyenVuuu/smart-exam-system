let activeStream: MediaStream | null = null
let scheduledStopId: number | null = null

function hasLiveVideoTrack(stream: MediaStream | null): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled))
}

export function getActiveExamWebcam(): MediaStream | null {
  if (hasLiveVideoTrack(activeStream)) return activeStream
  activeStream = null
  return null
}

export function hasActiveExamWebcam(): boolean {
  return getActiveExamWebcam() !== null
}

function waitForVideoMetadata(video: HTMLVideoElement): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_METADATA && video.videoWidth > 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error('WEBCAM_METADATA_TIMEOUT'))
    }, 1500)

    function cleanup() {
      window.clearTimeout(timeoutId)
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('error', handleError)
    }

    function handleLoaded() {
      cleanup()
      resolve()
    }

    function handleError() {
      cleanup()
      reject(new Error('WEBCAM_VIDEO_ERROR'))
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('error', handleError)
  })
}

export async function captureExamWebcamSnapshot(): Promise<File | null> {
  const stream = getActiveExamWebcam()
  if (!stream) return null

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = stream

  try {
    await video.play().catch(() => undefined)
    await waitForVideoMetadata(video)

    const trackSettings = stream.getVideoTracks()[0]?.getSettings()
    const width = video.videoWidth || trackSettings?.width || 1280
    const height = video.videoHeight || trackSettings?.height || 720
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height

    const context = canvas.getContext('2d')
    if (!context) return null

    context.drawImage(video, 0, 0, width, height)
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, 'image/jpeg', 0.82)
    })

    if (!blob) return null
    return new File([blob], `webcam-evidence-${Date.now()}.jpg`, { type: 'image/jpeg' })
  } catch {
    return null
  } finally {
    video.pause()
    video.srcObject = null
  }
}

export async function requestExamWebcam(): Promise<MediaStream> {
  const currentStream = getActiveExamWebcam()
  if (currentStream) return currentStream

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('WEBCAM_UNSUPPORTED')
  }

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: false,
    video: {
      facingMode: 'user',
      width: { ideal: 1280 },
      height: { ideal: 720 },
    },
  })

  if (!hasLiveVideoTrack(stream)) {
    stream.getTracks().forEach((track) => track.stop())
    throw new Error('WEBCAM_NOT_ACTIVE')
  }

  activeStream = stream
  return stream
}

export function stopExamWebcam(): void {
  if (scheduledStopId !== null) {
    window.clearTimeout(scheduledStopId)
    scheduledStopId = null
  }

  activeStream?.getTracks().forEach((track) => track.stop())
  activeStream = null
}

export function scheduleExamWebcamStop(): void {
  if (scheduledStopId !== null) window.clearTimeout(scheduledStopId)
  scheduledStopId = window.setTimeout(() => {
    scheduledStopId = null
    stopExamWebcam()
  }, 0)
}

export function cancelScheduledExamWebcamStop(): void {
  if (scheduledStopId === null) return
  window.clearTimeout(scheduledStopId)
  scheduledStopId = null
}
