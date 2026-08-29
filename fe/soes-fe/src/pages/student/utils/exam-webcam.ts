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
