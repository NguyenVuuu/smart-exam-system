export interface ExamCapabilities {
  canEdit: boolean
  canDelete: boolean
  canSubmitForApproval: boolean
  canSchedule: boolean
  canCopy: boolean
  canArchive: boolean
  lockReason?: string
}
