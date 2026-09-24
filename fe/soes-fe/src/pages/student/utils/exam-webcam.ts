let activeStream: MediaStream | null = null
let pendingStream: Promise<MediaStream> | null = null
let streamGeneration = 0
let scheduledStopId: number | null = null

export function isExamWebcamStreamLive(stream: MediaStream | null): boolean {
  return Boolean(stream?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled))
}

export function getActiveExamWebcam(): MediaStream | null {
  if (isExamWebcamStreamLive(activeStream)) return activeStream
  activeStream = null
  return null
}

export function hasActiveExamWebcam(): boolean {
  return getActiveExamWebcam() !== null
}

function waitForVideoMetadata(video: HTMLVideoElement, timeoutMs = 1500): Promise<void> {
  if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && video.videoWidth > 0 && video.videoHeight > 0) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      cleanup()
      reject(new Error('WEBCAM_METADATA_TIMEOUT'))
    }, timeoutMs)

    function cleanup() {
      window.clearTimeout(timeoutId)
      video.removeEventListener('loadedmetadata', handleLoaded)
      video.removeEventListener('canplay', handleLoaded)
      video.removeEventListener('error', handleError)
    }

    function handleLoaded() {
      if (video.videoWidth <= 0 || video.videoHeight <= 0) return
      cleanup()
      resolve()
    }

    function handleError() {
      cleanup()
      reject(new Error('WEBCAM_VIDEO_ERROR'))
    }

    video.addEventListener('loadedmetadata', handleLoaded)
    video.addEventListener('canplay', handleLoaded)
    video.addEventListener('error', handleError)
  })
}

export async function verifyExamWebcamStream(stream: MediaStream): Promise<void> {
  if (!isExamWebcamStreamLive(stream)) {
    throw new Error('WEBCAM_NOT_ACTIVE')
  }

  const video = document.createElement('video')
  video.muted = true
  video.playsInline = true
  video.srcObject = stream

  try {
    await video.play().catch(() => undefined)
    await waitForVideoMetadata(video, 2500)
  } finally {
    video.pause()
    video.srcObject = null
  }

  if (!isExamWebcamStreamLive(stream)) {
    throw new Error('WEBCAM_NOT_ACTIVE')
  }
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
  if (pendingStream) return pendingStream
  const generation = streamGeneration
  const request = openExamWebcam(generation)
  pendingStream = request
  try { return await request }
  finally { if (pendingStream === request) pendingStream = null }
}

async function openExamWebcam(generation: number): Promise<MediaStream> {
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

  try {
    await verifyExamWebcamStream(stream)
    if (generation !== streamGeneration) throw new Error('WEBCAM_NOT_ACTIVE')
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop())
    throw error
  }

  activeStream = stream
  return stream
}

export function stopExamWebcam(): void {
  streamGeneration += 1
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
