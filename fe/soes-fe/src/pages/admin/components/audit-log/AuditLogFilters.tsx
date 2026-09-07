import { Calendar, RotateCcw, Search, X } from 'lucide-react'
import AdminSelect from '../AdminSelect'
import { getAuditActionLabel, getAuditEntityLabel } from '../../constants/audit-log.labels'
import type { AuditLogFilterValues } from '../../hooks/useAuditLogFilters'

interface AuditLogFiltersProps {
  values: AuditLogFilterValues
  actions: string[]
  entityTypes: string[]
  onChange: (field: keyof AuditLogFilterValues, selectedValue: string) => void
  onReset: () => void
}

export default function AuditLogFilters({ values, actions, entityTypes, onChange, onReset }: AuditLogFiltersProps) {
  const actionOptions = [
    { value: 'ALL', label: 'Tất cả hành động' },
    ...actions.map((action) => ({ value: action, label: getAuditActionLabel(action) })),
  ]
  const entityOptions = [
    { value: 'ALL', label: 'Tất cả đối tượng' },
    ...entityTypes.map((entityType) => ({ value: entityType, label: getAuditEntityLabel(entityType) })),
  ]

  const activeFiltersCount = [
    values.search.trim() !== '',
    values.action !== 'ALL',
    values.entityType !== 'ALL',
    values.role !== 'ALL',
    values.fromDate !== '',
    values.toDate !== '',
  ].filter(Boolean).length

  return (
    <div className="flex flex-col gap-3.5 border-b border-gray-100 bg-white p-4">
      {/* Hàng 1: 5 bộ lọc chia đều trên grid */}
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 w-full">
        <AdminSelect
          value={values.action}
          onChange={(selectedAction) => onChange('action', selectedAction)}
          options={actionOptions}
        />
        <AdminSelect
          value={values.entityType}
          onChange={(selectedEntity) => onChange('entityType', selectedEntity)}
          options={entityOptions}
        />
        <AdminSelect
          value={values.role}
          onChange={(selectedRole) => onChange('role', selectedRole)}
          options={[
            { value: 'ALL', label: 'Tất cả vai trò' },
            { value: 'ADMIN', label: 'Quản trị viên' },
            { value: 'TEACHER', label: 'Giảng viên' },
            { value: 'STUDENT', label: 'Sinh viên' },
          ]}
        />
        <DateFilter
          label="Từ ngày"
          selectedDate={values.fromDate}
          max={values.toDate}
          onChange={(date) => onChange('fromDate', date)}
        />
        <DateFilter
          label="Đến ngày"
          selectedDate={values.toDate}
          min={values.fromDate}
          onChange={(date) => onChange('toDate', date)}
        />
      </div>

      {/* Hàng 2: Ô tìm kiếm & Nút Đặt lại dạng icon đặt kế bên */}
      <div className="flex items-center justify-between gap-3 pt-0.5">
        <div className="flex items-center gap-2.5 flex-1 max-w-xl">
          {/* Ô tìm kiếm thông minh */}
          <div className="flex h-10 flex-1 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={values.search}
              onChange={(event) => onChange('search', event.target.value)}
              placeholder="Tìm theo tên người thực hiện, mã số, email, IP hoặc ID đối tượng..."
              className="min-w-0 flex-1 bg-transparent text-sm font-normal text-slate-800 outline-none placeholder:text-slate-400"
            />
            {values.search && (
              <button
                type="button"
                onClick={() => onChange('search', '')}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700 cursor-pointer"
                title="Xóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Nút Đặt lại dạng icon kế bên ô tìm kiếm */}
          <button
            type="button"
            onClick={onReset}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-slate-500 transition-all hover:bg-gray-50 hover:text-slate-800 hover:border-gray-300 shadow-2xs cursor-pointer"
            title="Đặt lại bộ lọc"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Badge số điều kiện đang lọc (nếu có) */}
        {activeFiltersCount > 0 && (
          <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200/60 shrink-0">
            Đang lọc: {activeFiltersCount} tiêu chí
          </span>
        )}
      </div>
    </div>
  )
}

function DateFilter({
  label,
  selectedDate,
  min,
  max,
  onChange,
}: {
  label: string
  selectedDate: string
  min?: string
  max?: string
  onChange: (selectedDate: string) => void
}) {
  return (
    <label className="flex h-10 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-xs text-slate-500 transition-colors focus-within:border-emerald-500 focus-within:ring-2 focus-within:ring-emerald-100 cursor-pointer">
      <Calendar size={14} className="shrink-0 text-slate-400" />
      <span className="shrink-0 font-medium text-slate-500">{label}:</span>
      <input
        type="date"
        value={selectedDate}
        min={min || undefined}
        max={max || undefined}
        onChange={(event) => onChange(event.target.value)}
        className="min-w-0 flex-1 bg-transparent text-xs font-normal text-slate-700 outline-none cursor-pointer"
      />
      {selectedDate && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onChange('')
          }}
          className="shrink-0 rounded p-0.5 text-slate-400 hover:text-slate-700 hover:bg-gray-100"
          title="Xóa ngày"
        >
          <X size={12} />
        </button>
      )}
    </label>
  )
}

