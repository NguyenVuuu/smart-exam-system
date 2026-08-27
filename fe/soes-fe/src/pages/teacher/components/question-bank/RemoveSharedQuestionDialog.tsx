import { X } from 'lucide-react'
import type { Question } from '../../types/teacher-question-bank.types'

export default function RemoveSharedQuestionDialog({
  question,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  question: Question | null
  reason: string
  onReasonChange: (reason: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!question) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-gray-950">Gỡ khỏi Ngân hàng chung</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Câu hỏi vẫn thuộc ngân hàng cá nhân của giảng viên, nhưng sẽ ẩn khỏi ngân hàng chung đang dùng.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-400 transition-colors hover:bg-gray-100 hover:text-slate-700"
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-800">
            Gỡ câu hỏi: <span className="font-semibold text-slate-900">{question.content}</span>
          </div>
          <label className="block space-y-1.5">
            <span className="text-sm font-semibold text-gray-700">Lý do gỡ</span>
            <textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Nhập lý do để lưu vào lịch sử..."
              className="min-h-24 w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none transition-colors placeholder:text-gray-400 focus:border-blue-500"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="h-10 rounded-xl border border-gray-200 bg-white px-4 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={reason.trim().length < 5}
            className="h-10 rounded-xl border border-rose-600 bg-rose-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Xác nhận gỡ
          </button>
        </div>
      </div>
    </div>
  )
}
