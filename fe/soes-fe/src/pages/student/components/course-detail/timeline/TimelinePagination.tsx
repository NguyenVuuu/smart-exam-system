import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Pagination } from '../../../types/course-detail.types'

interface TimelinePaginationProps {
  pagination: Pagination
  currentPage: number
  onPageChange: (page: number) => void
}

export default function TimelinePagination({
  pagination,
  currentPage,
  onPageChange,
}: TimelinePaginationProps) {
  const { totalPages } = pagination

  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        disabled={currentPage <= 1}
        onClick={() => onPageChange(currentPage - 1)}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 text-sm rounded-lg border transition-colors ${
            p === currentPage
              ? 'bg-blue-600 border-blue-600 text-white font-medium'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          {p}
        </button>
      ))}

      <button
        disabled={currentPage >= totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
