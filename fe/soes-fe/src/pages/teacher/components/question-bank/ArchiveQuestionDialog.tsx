import { Archive, X } from 'lucide-react'
import type { Question } from '../../types/teacher-question-bank.types'

export default function ArchiveQuestionDialog({ question, onClose, onConfirm }: {
  question: Question | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!question) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-gray-950">Lưu trữ câu hỏi</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-gray-100" title="Đóng">
            <X size={18} />
          </button>
        </div>
        <div className="flex gap-3 px-6 py-5 text-sm leading-6 text-slate-600">
          <Archive className="mt-0.5 shrink-0 text-amber-500" size={20} />
          <p>Câu hỏi sẽ ẩn khỏi danh sách mặc định và không được chọn vào đề mới. Bạn vẫn có thể khôi phục sau.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium">Hủy</button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700">Lưu trữ</button>
        </div>
      </div>
    </div>
  )
}
