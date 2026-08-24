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
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [expandedKeys, setExpandedKeys] = useState<string[]>([])

  const totalPages = Math.ceil(data.length / pageSize) || 1
  const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize)

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
    <div className="bg-white border border-gray-100 rounded-2xl shadow-xs overflow-hidden font-sans">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-xs border-collapse table-auto">
          <thead>
            <tr className="bg-gray-50/80 border-b border-gray-100 text-gray-500 font-semibold uppercase text-[11px] tracking-wide select-none">
              {expandedRowRender && <th className="py-3.5 px-4 w-12 text-center"></th>}
              {selectable && (
                <th className="py-3.5 px-4 w-12 text-center">
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
                  className={`py-3.5 px-5 whitespace-nowrap ${
                    col.align === 'center'
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

          <tbody className="divide-y divide-gray-50">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse">
                  {expandedRowRender && <td className="py-4 px-3 w-10"></td>}
                  {selectable && <td className="py-4 px-3 w-10"></td>}
                  {columns.map((_, cIdx) => (
                    <td key={cIdx} className="py-4 px-4">
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
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Inbox size={20} />
                    </div>
                    <p className="text-xs font-medium text-gray-500">{emptyText}</p>
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
                      className={`transition-colors ${
                        onRowClick ? 'cursor-pointer' : ''
                      } ${
                        isSelected
                          ? 'bg-blue-50/50 hover:bg-blue-50'
                          : 'hover:bg-gray-50/70'
                      }`}
                    >
                      {expandedRowRender && (
                        <td className="py-3.5 px-3 w-10 text-center">
                          <button
                            onClick={(e) => toggleExpand(key, e)}
                            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                          >
                            {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                          </button>
                        </td>
                      )}

                      {selectable && (
                        <td className="py-3.5 px-3 w-10 text-center">
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
                          className={`py-4 px-5 text-gray-700 align-middle ${
                            col.align === 'center'
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
                          className="p-4"
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
      {!isLoading && data.length > 0 && (
        <div className="px-4 py-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
          <div>
            Hiển thị <span className="font-semibold text-gray-800">{(currentPage - 1) * pageSize + 1}</span> -{' '}
            <span className="font-semibold text-gray-800">
              {Math.min(currentPage * pageSize, data.length)}
            </span>{' '}
            trên tổng số <span className="font-semibold text-gray-800">{data.length}</span> bản ghi
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft size={15} />
            </button>

            <span className="px-3 font-semibold text-gray-700">
              {currentPage} / {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
