import { AlertTriangle, X } from 'lucide-react'
import type { SharedQuestionAdmin } from '../../types/admin.types'
import AdminButton from '../AdminButton'
import { AdminTextarea } from '../AdminFormFields'

export default function SharedQuestionRemoveDialog({
  question,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
}: {
  question: SharedQuestionAdmin | null
  reason: string
  onReasonChange: (val: string) => void
  onClose: () => void
  onConfirm: () => void
}) {
  if (!question) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="flex w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-5">
          <div>
            <h2 className="text-base font-semibold text-slate-950">Gỡ câu hỏi khỏi Ngân hàng chung</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Câu hỏi sẽ chuyển sang trạng thái tạm ngưng sử dụng trong kho câu hỏi dùng chung toàn trường.
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
          <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertTriangle size={18} className="shrink-0 text-amber-500" />
            <p className="line-clamp-2 font-medium">{question.title}</p>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-semibold text-slate-700">Lý do gỡ</span>
            <AdminTextarea
              value={reason}
              onChange={(e) => onReasonChange(e.target.value)}
              placeholder="Nhập lý do gỡ..."
              className="min-h-24"
            />
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4">
          <AdminButton tone="secondary" onClick={onClose}>
            Hủy
          </AdminButton>
          <AdminButton tone="danger" onClick={onConfirm}>
            Xác nhận gỡ
          </AdminButton>
        </div>
      </div>
    </div>
  )
}
