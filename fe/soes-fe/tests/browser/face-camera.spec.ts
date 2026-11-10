import { expect, test } from '@playwright/test'
import { trackFaceCameraStreams } from '../../src/pages/student/components/face/face-camera'

function cameraStream() {
  let stops = 0
  const stream = { getTracks: () => [{ stop: () => { stops += 1 } }] } as unknown as MediaStream
  return { stream, get stops() { return stops } }
}

test('closes both camera streams when the detector opens a replacement device', async () => {
  const first = cameraStream()
  const replacement = cameraStream()
  const streams = [first.stream, replacement.stream]
  const getUserMedia = async () => streams.shift()!
  const devices = { getUserMedia } as unknown as MediaDevices
  const tracker = trackFaceCameraStreams(devices)

  await devices.getUserMedia({ video: true })
  await devices.getUserMedia({ video: true })
  tracker.stop()
  tracker.release()

  expect(first.stops).toBe(1)
  expect(replacement.stops).toBe(1)
  expect(devices.getUserMedia).toBe(getUserMedia)
})

test('closes a camera stream that opens after the detector is removed', async () => {
  const late = cameraStream()
  let resolveStream!: (stream: MediaStream) => void
  const getUserMedia = () => new Promise<MediaStream>((resolve) => { resolveStream = resolve })
  const devices = { getUserMedia } as unknown as MediaDevices
  const tracker = trackFaceCameraStreams(devices)

  const pending = devices.getUserMedia({ video: true })
  tracker.release()
  resolveStream(late.stream)
  await pending

  expect(late.stops).toBe(1)
  expect(devices.getUserMedia).toBe(getUserMedia)
})
