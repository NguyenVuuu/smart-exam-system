import { Wrench, AlertTriangle, BookOpen, HelpCircle, type LucideIcon } from 'lucide-react'
import type { ExamSubmission } from '../../types/teacher-exam.types'

export type AdjustmentType = 'SYSTEM_ERROR' | 'VIOLATION' | 'MANUAL_REVIEW' | 'OTHER'

export const ADJUSTMENT_TYPE_OPTIONS: Array<{ value: AdjustmentType; label: string; icon: LucideIcon }> = [
  { value: 'SYSTEM_ERROR', label: 'Hệ thống chấm sai', icon: Wrench },
  { value: 'VIOLATION', label: 'Gian lận (có bằng chứng)', icon: AlertTriangle },
  { value: 'MANUAL_REVIEW', label: 'Chấm tay / Lập trình', icon: BookOpen },
  { value: 'OTHER', label: 'Lý do khác', icon: HelpCircle },
]

/** Một dòng sinh viên có điểm thay đổi trong luồng "chốt cả ca" */
export interface ChangedItem {
  submission: ExamSubmission;
  score: number;
  reason: string;
  adjustmentType: AdjustmentType;
  evidenceUrls: string[];
  violationIds: string[];
}

/** Trạng thái modal bulk */
export type BulkModal =
  | { kind: "confirm" }
  | { kind: "reasons"; items: ChangedItem[]; cursor: number };
