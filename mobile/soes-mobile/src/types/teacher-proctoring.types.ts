export type ProctoringViolationType =
  | 'TAB_SWITCH' | 'FULLSCREEN_EXIT' | 'COPY_PASTE' | 'RIGHT_CLICK'
  | 'NO_FACE' | 'MULTIPLE_FACES' | 'LOOKING_AWAY' | 'PHONE_DETECTED'
  | 'CAMERA_BLOCKED' | 'CAMERA_DISCONNECTED' | 'CAMERA_PERMISSION_DENIED'
  | 'SCREEN_SHARE_STOPPED' | 'SCREEN_PERMISSION_DENIED'
  | 'PROCTOR_WEBCAM_CAPTURE' | 'PROCTOR_SCREEN_CAPTURE'
  | 'IP_CHANGED' | 'HEARTBEAT_MISSED' | 'MULTIPLE_ACTIVE_SESSIONS' | 'INACTIVITY'

export interface ProctoringViolation {
  id: string
  scheduleId: string
  attemptId: string
  studentId: string
  studentCode: string
  studentName: string
  type: ProctoringViolationType
  timestamp: string
  endedAt?: string | null
  durationSeconds?: number | null
  severity: 'LOW' | 'MEDIUM' | 'HIGH'
  evidenceImageUrl?: string
  evidenceText?: string | null
  metadata?: unknown
  reviewStatus?: string
  note?: string
}
