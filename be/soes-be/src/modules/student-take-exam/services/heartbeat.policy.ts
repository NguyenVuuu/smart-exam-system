import type { ScreenShareStatus, WebcamStatus } from '@prisma/client'

export function normalizeWebcamHeartbeat(required: boolean, reported?: WebcamStatus): WebcamStatus {
  if (!required) return 'NOT_REQUIRED'
  return reported && reported !== 'NOT_REQUIRED' ? reported : 'DISCONNECTED'
}

export function normalizeScreenHeartbeat(required: boolean, reported?: ScreenShareStatus): ScreenShareStatus {
  if (!required) return 'NOT_REQUIRED'
  return reported && reported !== 'NOT_REQUIRED' ? reported : 'STOPPED'
}
