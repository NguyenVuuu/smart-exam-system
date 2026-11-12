import type { SeverityLevel, ViolationType } from '@prisma/client'
import { ConflictError, ForbiddenError } from '../../../errors/AppError'

type IntegrityFlags = {
  enableTabLock: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  enableScreenMonitoring: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
}

const severityByType: Record<ViolationType, SeverityLevel> = {
  TAB_SWITCH: 'MEDIUM', FULLSCREEN_EXIT: 'MEDIUM', NO_FACE: 'MEDIUM',
  MULTIPLE_FACES: 'HIGH', INACTIVITY: 'MEDIUM', LOOKING_AWAY: 'LOW',
  PHONE_DETECTED: 'HIGH', COPY_PASTE: 'LOW', RIGHT_CLICK: 'LOW',
  CAMERA_BLOCKED: 'HIGH', CAMERA_DISCONNECTED: 'MEDIUM', CAMERA_PERMISSION_DENIED: 'HIGH',
  SCREEN_SHARE_STOPPED: 'MEDIUM', SCREEN_PERMISSION_DENIED: 'HIGH',
  PROCTOR_WEBCAM_CAPTURE: 'LOW', PROCTOR_SCREEN_CAPTURE: 'LOW',
}

export function studentViolationSeverity(type: ViolationType, flags: IntegrityFlags): SeverityLevel {
  if (type.startsWith('PROCTOR_')) throw new ForbiddenError('This violation is reserved for proctors')
  const requiredFlag =
    type === 'TAB_SWITCH' ? 'enableTabLock' :
    type === 'FULLSCREEN_EXIT' ? 'requireFullscreen' :
    type === 'COPY_PASTE' ? 'blockCopyPaste' :
    type === 'RIGHT_CLICK' ? 'blockRightClick' :
    ['NO_FACE', 'MULTIPLE_FACES', 'LOOKING_AWAY', 'PHONE_DETECTED', 'CAMERA_BLOCKED', 'CAMERA_DISCONNECTED', 'CAMERA_PERMISSION_DENIED'].includes(type) ? 'enableWebcam' :
    ['SCREEN_SHARE_STOPPED', 'SCREEN_PERMISSION_DENIED'].includes(type) ? 'enableScreenMonitoring' : null
  if (requiredFlag && !flags[requiredFlag]) throw new ConflictError('This monitoring rule is disabled for the exam schedule')
  return severityByType[type]
}
