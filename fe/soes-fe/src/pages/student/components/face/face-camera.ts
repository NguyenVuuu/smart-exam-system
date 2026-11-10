function stopStream(stream: MediaStream) {
  stream.getTracks().forEach((track) => track.stop())
}

/** Own every camera stream opened while the liveness detector is mounted. */
export function trackFaceCameraStreams(devices: MediaDevices) {
  const streams = new Set<MediaStream>()
  const originalGetUserMedia = devices.getUserMedia
  let active = true

  const trackedGetUserMedia: MediaDevices['getUserMedia'] = async (constraints) => {
    const stream = await originalGetUserMedia.call(devices, constraints)
    if (constraints?.video) {
      if (active) streams.add(stream)
      else stopStream(stream)
    }
    return stream
  }

  devices.getUserMedia = trackedGetUserMedia

  const stop = () => {
    streams.forEach(stopStream)
    streams.clear()
  }

  return {
    stop,
    release: () => {
      active = false
      if (devices.getUserMedia === trackedGetUserMedia) devices.getUserMedia = originalGetUserMedia
      stop()
    },
  }
}
