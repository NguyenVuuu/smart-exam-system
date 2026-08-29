import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import type { ExamSchedule } from '../../types/teacher-exam.types'

export default function CancelTeacherScheduleDialog({ schedule, onClose, onConfirm }: {
  schedule: ExamSchedule | null
  onClose: () => void
  onConfirm: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  if (!schedule) return null

  const confirm = async () => {
    if (reason.trim().length < 5) return
    setSaving(true)
    try { await onConfirm(reason.trim()) } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-slate-950/45 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-900">Hủy ca thi</h2>
          <button aria-label="Đóng" onClick={onClose} className="text-slate-400 hover:text-slate-700"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-6 py-5">
          <div className="flex gap-3 text-sm text-slate-600"><AlertTriangle className="shrink-0 text-amber-500" size={20} /><p>Ca thi của lớp {schedule.courseCode} sẽ ngừng áp dụng. Dữ liệu lịch sử vẫn được giữ lại.</p></div>
          <label className="block space-y-1.5 text-sm font-medium text-slate-700">Lý do hủy
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-xl border border-gray-200 p-3 font-normal outline-none focus:border-blue-400" />
          </label>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button onClick={onClose} className="rounded-xl border border-gray-200 px-4 py-2 text-sm">Đóng</button>
          <button disabled={saving || reason.trim().length < 5} onClick={() => void confirm()} className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Xác nhận hủy</button>
        </div>
      </div>
    </div>
  )
}
