import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Inbox,
} from 'lucide-react'
import React, { useState } from 'react'

export interface ColumnDef<T> {
  header: React.ReactNode
  accessorKey?: keyof T
  render?: (item: T, index: number) => React.ReactNode
  width?: string
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface DataTableProps<T> {
  columns: ColumnDef<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  expandedRowRender?: (item: T) => React.ReactNode
  isLoading?: boolean
  emptyText?: string
  pageSize?: number
  selectable?: boolean
  selectedKeys?: string[]
  onSelectChange?: (selectedKeys: string[]) => void
  onRowClick?: (item: T) => void
  embedded?: boolean
  page?: number
  totalItems?: number
  totalPages?: number
  onPageChange?: (page: number) => void
  hidePagination?: boolean
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  expandedRowRender,
  isLoading = false,
  emptyText = 'Không tìm thấy dữ liệu phù hợp',
  pageSize = 10,
  selectable = false,
  selectedKeys = [],
  onSelectChange,
  onRowClick,
  embedded = false,
  page,
  totalItems,
  totalPages,
  onPageChange,
  hidePagination = false,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const isServerPaged = Boolean(onPageChange)
  const activePage = isServerPaged ? (page ?? 1) : currentPage
  const activeTotalItems = totalItems ?? data.length
  const activeTotalPages = totalPages ?? (Math.ceil(activeTotalItems / pageSize) || 1)
  const paginatedData = isServerPaged
    ? data
    : data.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const toggleExpand = (key: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedKeys((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  const toggleSelectAll = () => {
    if (!onSelectChange) return
    if (selectedKeys.length === data.length) {
      onSelectChange([])
    } else {
      onSelectChange(data.map(keyExtractor))
    }
  }

  const toggleSelectRow = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    e.stopPropagation()
    if (!onSelectChange) return
    if (selectedKeys.includes(key)) {
      onSelectChange(selectedKeys.filter((k) => k !== key))
    } else {
      onSelectChange([...selectedKeys, key])
    }
  }

  return (
    <div
      className={
        embedded
          ? 'overflow-hidden bg-white font-sans'
          : 'overflow-hidden rounded-2xl border border-gray-100 bg-white font-sans shadow-xs'
      }
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm border-collapse table-auto">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-bold uppercase text-[11px] tracking-wider select-none">
              {expandedRowRender && <th className="py-4 px-4 w-12 text-center"></th>}
              {selectable && (
                <th className="py-4 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedKeys.length === data.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  style={{ width: col.width }}
                  className={`py-4 px-6 whitespace-nowrap ${col.align === 'center'
                      ? 'text-center'
                      : col.align === 'right'
                        ? 'text-right'
                        : 'text-left'
                    } ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {expandedRowRender && <td className="py-4 px-3 w-10"></td>}
                  {selectable && <td className="py-4 px-3 w-10"></td>}
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-6">
                      <div className="h-4 bg-gray-100 rounded-md w-3/4"></div>
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (expandedRowRender ? 1 : 0) + (selectable ? 1 : 0)}
                  className="py-12 px-4 text-center text-gray-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">
                      <Inbox size={22} />
                    </div>
                    <p className="text-sm font-medium text-gray-500">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const key = keyExtractor(item)
                const isExpanded = expandedKeys.includes(key)
                const isSelected = selectedKeys.includes(key)

                return (
                  <React.Fragment key={key}>
                    <tr
                      onClick={() => onRowClick && onRowClick(item)}
                      className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''
                        } ${isSelected
                          ? 'bg-blue-50/50 hover:bg-blue-50'
                          : 'hover:bg-gray-50/60'
                        }`}
                    >
                      {expandedRowRender && (
                        <td className="py-4 px-3 w-10 text-center">
                          <button
                            onClick={(e) => toggleExpand(key, e)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </td>
                      )}

                      {selectable && (
                        <td className="py-4 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => toggleSelectRow(key, e)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-0 cursor-pointer"
                          />
                        </td>
                      )}

                      {columns.map((col, cIdx) => (
                        <td
                          key={cIdx}
                          style={{ width: col.width }}
                          className={`py-4 px-6 text-gray-800 align-middle text-sm ${col.align === 'center'
                              ? 'text-center'
                              : col.align === 'right'
                                ? 'text-right'
                                : 'text-left'
                            } ${col.className || ''}`}
                        >
                          {col.render
                            ? col.render(item, (currentPage - 1) * pageSize + index)
                            : col.accessorKey
                              ? String(item[col.accessorKey] ?? '')
                              : null}
                        </td>
                      ))}
                    </tr>

                    {/* Expandable Content Row */}
                    {expandedRowRender && isExpanded && (
                      <tr className="bg-gray-50/70 border-b border-gray-100">
                        <td
                          colSpan={columns.length + 1 + (selectable ? 1 : 0)}
                          className="p-5"
                        >
                          <div className="animate-in fade-in duration-150">
                            {expandedRowRender(item)}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && activeTotalItems > 0 && !hidePagination && (
        <div className="px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>
            Hiển thị{' '}
            <span className="font-bold text-gray-800">{(activePage - 1) * pageSize + 1}</span> -{' '}
            <span className="font-bold text-gray-800">
              {Math.min(activePage * pageSize, activeTotalItems)}
            </span>{' '}
            trên tổng số <span className="font-bold text-gray-800">{activeTotalItems}</span> bản ghi
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const prev = Math.max(1, activePage - 1)
                if (onPageChange) onPageChange(prev)
                else setCurrentPage(prev)
              }}
              disabled={activePage <= 1}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <span className="px-3 font-bold text-gray-700">
              {activePage} / {activeTotalPages}
            </span>

            <button
              type="button"
              onClick={() => {
                const next = Math.min(activeTotalPages, activePage + 1)
                if (onPageChange) onPageChange(next)
                else setCurrentPage(next)
              }}
              disabled={activePage >= activeTotalPages}
              className="p-2 rounded-xl border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
