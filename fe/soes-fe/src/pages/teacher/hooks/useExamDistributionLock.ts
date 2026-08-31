import { useState } from 'react'
import { toast } from 'sonner'
import {
  lockTeacherExamDistribution,
  unlockTeacherExamDistribution,
} from '../api/teacher-exams.api'

export function useExamDistributionLock(examId: string, onRefresh: () => Promise<void>) {
  const [action, setAction] = useState<'LOCK' | 'UNLOCK' | null>(null)
  const [saving, setSaving] = useState(false)

  const confirm = async () => {
    if (!action) return
    setSaving(true)
    try {
      if (action === 'LOCK') await lockTeacherExamDistribution(examId)
      else await unlockTeacherExamDistribution(examId)
      const message = action === 'LOCK' ? 'Đã chốt lịch thi.' : 'Đã mở lại lịch thi.'
      setAction(null)
      await onRefresh()
      toast.success(message)
    } catch {
      toast.error(action === 'LOCK'
        ? 'Không thể chốt lịch thi ở trạng thái hiện tại.'
        : 'Không thể mở lại vì ca thi đã bắt đầu hoặc đã có sinh viên vào thi.')
    } finally {
      setSaving(false)
    }
  }

  return {
    action,
    saving,
    requestLock: () => setAction('LOCK' as const),
    requestUnlock: () => setAction('UNLOCK' as const),
    close: () => { if (!saving) setAction(null) },
    confirm,
  }
}
