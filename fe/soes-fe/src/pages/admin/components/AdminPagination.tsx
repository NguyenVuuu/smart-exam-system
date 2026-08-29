import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function AdminPagination({
  page,
  pageSize = 10,
  totalPages,
  totalItems,
  onChange,
}: {
  page: number
  pageSize?: number
  totalPages: number
  totalItems: number
  onChange: (page: number) => void
}) {
  const from = totalItems === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, totalItems)

  return (
    <div className="flex items-center justify-between border-t border-gray-100 bg-white px-6 py-4 text-sm text-gray-500">
      <div>
        Hiển thị <span className="font-bold text-gray-800">{from}</span> -{' '}
        <span className="font-bold text-gray-800">{to}</span> trên tổng số{' '}
        <span className="font-bold text-gray-800">{totalItems}</span> bản ghi
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Trang trước"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
          className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="px-3 font-bold text-gray-700">
          {page} / {Math.max(1, totalPages)}
        </span>

        <button
          type="button"
          aria-label="Trang sau"
          disabled={page >= totalPages}
          onClick={() => onChange(page + 1)}
          className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
