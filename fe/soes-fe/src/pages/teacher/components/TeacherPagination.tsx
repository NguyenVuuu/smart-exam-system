import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function TeacherPagination({ page, totalPages, totalItems, onChange }: {
  page: number; totalPages: number; totalItems: number; onChange: (page: number) => void
}) {
  return (
    <div className="flex items-center justify-between border-t border-gray-100 px-5 py-4 text-sm text-slate-500">
      <span>Tổng số {totalItems} bản ghi</span>
      <div className="flex items-center gap-3">
        <button aria-label="Trang trước" disabled={page <= 1} onClick={() => onChange(page - 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-40"><ChevronLeft size={16} /></button>
        <span className="font-medium text-slate-700">{page} / {Math.max(1, totalPages)}</span>
        <button aria-label="Trang sau" disabled={page >= totalPages} onClick={() => onChange(page + 1)} className="grid h-9 w-9 place-items-center rounded-lg border border-gray-200 hover:bg-blue-50 disabled:opacity-40"><ChevronRight size={16} /></button>
      </div>
    </div>
  )
}
