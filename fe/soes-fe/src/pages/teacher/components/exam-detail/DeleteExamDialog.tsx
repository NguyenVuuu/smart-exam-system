import { AlertTriangle, X } from 'lucide-react'
import type { Exam } from '../../types/teacher-exam.types'

export default function DeleteExamDialog({ exam, onClose, onConfirm }: {
  exam: Exam | null; onClose: () => void; onConfirm: () => void
}) {
  if (!exam) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
          <h2 className="text-base font-semibold text-slate-950">Xóa đề thi nháp</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-gray-100" title="Đóng"><X size={18} /></button>
        </div>
        <div className="flex gap-3 px-6 py-5 text-sm leading-6 text-slate-600">
          <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={20} />
          <p>Xóa đề <span className="font-semibold text-slate-900">{exam.title}</span>? Thao tác này chỉ áp dụng cho đề nháp chưa có ca thi.</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-gray-200 px-4 text-sm font-medium">Hủy</button>
          <button type="button" onClick={onConfirm} className="h-10 rounded-lg bg-rose-600 px-4 text-sm font-medium text-white hover:bg-rose-700">Xóa đề</button>
        </div>
      </div>
    </div>
  )
}
