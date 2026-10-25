import { X } from 'lucide-react'
import type { ApprovalItem } from '../../types/teacher-approval.types'

interface ApprovalRejectModalProps {
  item: ApprovalItem
  reason: string
  onReasonChange: (value: string) => void
  questionNotes: Record<string, string>
  onClose: () => void
  onSubmit: () => void
}

export default function ApprovalRejectModal({
  item,
  reason,
  onReasonChange,
  questionNotes,
  onClose,
  onSubmit,
}: ApprovalRejectModalProps) {
  const noteCount = Object.values(questionNotes).filter((note) => note.trim()).length

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {item.kind === 'EXAM' ? 'Yêu cầu sửa đề' : 'Từ chối câu hỏi'}
            </h2>
            <p className="mt-0.5 line-clamp-1 text-xs text-gray-500">{item.title}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Đóng"
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X size={18} />
          </button>
        </div>
        <div className="space-y-4 overflow-y-auto p-5">
          {item.kind === 'EXAM' ? (
            <p className="text-sm text-gray-700">
              Xác nhận gửi yêu cầu sửa đề với {noteCount} góp ý theo câu hỏi cho người ra đề?
            </p>
          ) : (
            <label className="block text-xs font-semibold text-gray-700">
              Lý do từ chối
              <textarea
                value={reason}
                onChange={(event) => onReasonChange(event.target.value)}
                rows={4}
                placeholder="Nhập lý do từ chối câu hỏi"
                className="mt-2 w-full rounded-xl border border-gray-200 p-3 text-sm font-normal outline-none transition-colors focus:border-blue-500"
              />
            </label>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 p-4">
          <button
            onClick={onClose}
            className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
          >
            Hủy
          </button>
          <button
            disabled={item.kind === 'EXAM' ? !Object.values(questionNotes).some((note) => note.trim()) : reason.trim().length < 5}
            onClick={onSubmit}
            className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {item.kind === 'EXAM' ? 'Xác nhận gửi' : 'Xác nhận từ chối'}
          </button>
        </div>
      </div>
    </div>
  )
}
