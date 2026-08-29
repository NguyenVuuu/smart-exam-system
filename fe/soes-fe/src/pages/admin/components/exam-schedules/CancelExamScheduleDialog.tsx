import { useState } from 'react'
import type { AdminExamSchedule } from '../../types/admin.types'
import { AdminField, AdminTextarea } from '../AdminFormFields'
import AdminModal from '../AdminModal'

export default function CancelExamScheduleDialog({
  schedule, onClose, onConfirm,
}: {
  schedule: AdminExamSchedule | null
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('Hủy ca thi theo quyết định của phòng khảo thí.')
  const [saving, setSaving] = useState(false)

  const confirm = async () => {
    if (reason.trim().length < 5) return
    setSaving(true)
    try { await onConfirm(reason.trim()) } finally { setSaving(false) }
  }

  return (
    <AdminModal
      open={Boolean(schedule)} size="md" title="Xác nhận hủy ca thi"
      description={schedule ? `Ca thi “${schedule.examTitle}” sẽ ngừng áp dụng cho toàn bộ lớp đã gán.` : undefined}
      confirmText={saving ? 'Đang hủy...' : 'Hủy ca thi'} confirmTone="danger"
      confirmDisabled={saving || reason.trim().length < 5} onClose={onClose} onConfirm={confirm}
    >
      <AdminField label="Lý do hủy">
        <AdminTextarea value={reason} onChange={(event) => setReason(event.target.value)} />
      </AdminField>
    </AdminModal>
  )
}
