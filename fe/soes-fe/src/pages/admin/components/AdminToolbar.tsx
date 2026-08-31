import { RefreshCw, Search, X } from 'lucide-react'
import type { ReactNode } from 'react'

interface AdminToolbarProps {
  filters?: ReactNode
  searchValue: string
  onSearchChange: (value: string) => void
  searchPlaceholder: string
  onReset?: () => void
  stacked?: boolean
  singleLine?: boolean
  variant?: 'default' | 'split'
}

export default function AdminToolbar({
  filters,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  onReset,
  stacked = false,
  singleLine = false,
  variant = 'default',
}: AdminToolbarProps) {
  if (variant === 'split') {
    return (
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4">
        {/* Hàng 1: Bộ lọc */}
        {filters && (
          <div className="w-full">
            {filters}
          </div>
        )}

        {/* Hàng 2: Ô tìm kiếm ngắn gọn, tiếp theo là nút Đặt lại */}
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-72 sm:w-80 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
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
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-gray-50 hover:text-slate-800 cursor-pointer shadow-2xs"
              title="Làm mới bộ lọc"
            >
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      </div>
    )
  }
  if (stacked) {
    return (
      <div className="flex flex-col gap-3 border-b border-gray-100 bg-white p-4">
        {filters && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 w-full">
            {filters}
          </div>
        )}

        <div className="flex items-center gap-2.5 w-full">
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-gray-50 hover:text-slate-800 cursor-pointer"
              title="Làm mới bộ lọc"
            >
              <RefreshCw size={16} />
            </button>
          )}
          <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600">
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
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700 cursor-pointer"
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

  return (
    <div className={`flex flex-col gap-3 border-b border-gray-100 bg-white p-4 ${singleLine ? '2xl:flex-row 2xl:items-center' : 'xl:flex-row xl:items-center'} xl:justify-between`}>
      <div className={`flex flex-wrap items-center gap-2.5 ${singleLine ? '2xl:min-w-0 2xl:flex-1 2xl:flex-nowrap' : ''}`}>
        {filters}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {onReset && (
          <button
            type="button"
            onClick={onReset}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-colors hover:bg-gray-50 hover:text-slate-800"
            title="Làm mới bộ lọc"
          >
            <RefreshCw size={16} />
          </button>
        )}
        <div className="flex h-10 w-full min-w-[220px] items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 sm:w-72">
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
