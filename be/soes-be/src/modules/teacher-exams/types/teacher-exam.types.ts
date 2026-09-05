export interface ExamCapabilities {
  canEdit: boolean
  canDelete: boolean
  canSubmitForApproval: boolean
  canSchedule: boolean
  canLock: boolean
  canUnlock: boolean
  canToggleStudentVisibility: boolean
  canCopy: boolean
  canArchive: boolean
  lockReason?: string
}
