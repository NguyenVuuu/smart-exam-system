import { RefreshCw, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface TeacherToolbarProps {
  filters?: ReactNode
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  onReset?: () => void
}

export default function TeacherToolbar({
  filters,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onReset,
}: TeacherToolbarProps) {
  return (
    <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-3">{filters}</div>

      <div className="flex items-center gap-2">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600"
            title="Làm mới bộ lọc"
          >
            <RefreshCw size={16} />
          </button>
        )}
        <div className="flex h-10 w-full min-w-[260px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 sm:w-80">
          <Search size={16} className="shrink-0 text-slate-400" />
          <input
            value={searchValue}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder={searchPlaceholder}
            className="min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-slate-400"
          />
          {searchValue && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700"
              title="Xóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
