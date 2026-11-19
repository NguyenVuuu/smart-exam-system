import { ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'

type Action = 'WARN' | 'FORCE_SUBMIT'

interface Props {
  action: Action
  studentName: string
  studentCode: string
  submitting: boolean
  onClose: () => void
  onConfirm: (reason: string) => void
}

const labels: Record<Action, { title: string; description: string; button: string }> = {
  WARN: {
    title: 'Cảnh cáo sinh viên',
    description: 'Nội dung cảnh cáo sẽ được gửi cho sinh viên và lưu vào nhật ký vi phạm.',
    button: 'Gửi cảnh cáo',
  },
  FORCE_SUBMIT: {
    title: 'Buộc nộp bài thi',
    description: 'Các câu trả lời đã lưu được giữ lại để chấm và xem xét. Sinh viên không thể tiếp tục làm bài.',
    button: 'Buộc nộp bài',
  },
}

export default function ProctoringActionModal({ action, studentName, studentCode, submitting, onClose, onConfirm }: Props) {
  const [reason, setReason] = useState('')
  const details = labels[action]
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-xs" role="dialog" aria-modal="true" aria-labelledby="proctoring-action-title">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 id="proctoring-action-title" className="text-base font-bold text-slate-900">{details.title}</h2>
            <p className="mt-1 text-xs text-slate-500">{studentName} · MSSV: {studentCode}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X size={18} /></button>
        </div>
        <div className="space-y-4 px-5 py-5">
          <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {details.description}
          </p>
          <label className="block text-sm font-semibold text-slate-800" htmlFor="proctoring-action-reason">Lý do xử lý</label>
          <textarea id="proctoring-action-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} rows={4}
            placeholder="Mô tả sự kiện và bằng chứng đã kiểm tra (ít nhất 5 ký tự)"
            className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
          <button type="button" onClick={onClose} disabled={submitting} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50">Đóng</button>
          <button type="button" onClick={() => onConfirm(reason.trim())} disabled={reason.trim().length < 5 || submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
            <ShieldAlert size={16} /> {submitting ? 'Đang xử lý...' : details.button}
          </button>
        </div>
      </div>
    </div>
  )
}
