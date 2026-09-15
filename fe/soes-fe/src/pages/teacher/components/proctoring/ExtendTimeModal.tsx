import { ClockPlus, X } from 'lucide-react'
import { useState } from 'react'
import type { ProctoringSessionRecord } from '../../types/teacher-exam.types'

export interface ExtendTimeModalProps {
  session: ProctoringSessionRecord
  submitting: boolean
  onClose: () => void
  onSubmit: (extraMinutes: number, reason: string) => void
}

const PRESET_MINUTES = [5, 10, 15, 30]

export default function ExtendTimeModal({
  session,
  submitting,
  onClose,
  onSubmit,
}: ExtendTimeModalProps) {
  const [extraMinutes, setExtraMinutes] = useState(10)
  const [reasonType, setReasonType] = useState('Lỗi chia sẻ màn hình')
  const [note, setNote] = useState('')
  const reason = `${reasonType}${note.trim() ? ` - ${note.trim()}` : ''}`
  const canSubmit = extraMinutes >= 1 && extraMinutes <= 180 && reason.trim().length >= 3 && !submitting

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Gia hạn thời gian làm bài</h2>
            <p className="mt-1 text-xs text-slate-500">{session.studentName} · MSSV: {session.studentCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50 transition-colors cursor-pointer"
            aria-label="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {PRESET_MINUTES.map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setExtraMinutes(minutes)}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors cursor-pointer ${
                  extraMinutes === minutes
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                }`}
              >
                +{minutes} phút
              </button>
            ))}
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-slate-500">Khác</span>
              <input
                type="number"
                min={1}
                max={180}
                value={extraMinutes}
                onChange={(event) => setExtraMinutes(Number(event.target.value))}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Lý do</label>
            <select
              value={reasonType}
              onChange={(event) => setReasonType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
            >
              <option>Lỗi chia sẻ màn hình</option>
              <option>Mất kết nối mạng</option>
              <option>Vào thi muộn có xác nhận</option>
              <option>Lỗi camera</option>
              <option>Sự cố thiết bị</option>
              <option>Sự cố khác</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Ghi chú</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Ví dụ: Sinh viên báo mất màn hình share từ 08:12 đến 08:18."
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </div>

          <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
            Thao tác này chỉ áp dụng cho sinh viên được chọn và sẽ được lưu vào lịch sử xử lý của attempt.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50 cursor-pointer"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSubmit(extraMinutes, reason)}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
          >
            <ClockPlus size={16} /> {submitting ? 'Đang gia hạn...' : 'Xác nhận gia hạn'}
          </button>
        </div>
      </div>
    </div>
  )
}
