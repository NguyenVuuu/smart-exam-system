import { CalendarDays, List, Search, X } from 'lucide-react'
import AppSelect from '../../../../components/common/AppSelect'
import type { SemesterOption } from '../../types/subjects.types'
import {
  STUDENT_EXAM_FILTERS,
  type StudentExamFilter,
  type StudentExamViewMode,
} from './student-exam.types'

interface StudentExamToolbarProps {
  semesterOptions: SemesterOption[]
  semesterId: string
  keyword: string
  filter: StudentExamFilter
  viewMode: StudentExamViewMode
  disabled?: boolean
  onSemesterChange: (value: string) => void
  onKeywordChange: (value: string) => void
  onFilterChange: (value: StudentExamFilter) => void
  onViewModeChange: (value: StudentExamViewMode) => void
}

export default function StudentExamToolbar({
  semesterOptions,
  semesterId,
  keyword,
  filter,
  viewMode,
  disabled,
  onSemesterChange,
  onKeywordChange,
  onFilterChange,
  onViewModeChange,
}: StudentExamToolbarProps) {
  return (
    <div className="border-b border-slate-200 bg-white p-4">
      <div className="grid min-h-11 gap-3 lg:grid-cols-[256px_minmax(260px,1fr)_230px] lg:items-center">
        <AppSelect
          value={semesterId}
          onChange={onSemesterChange}
          disabled={semesterOptions.length === 0 || disabled}
          placeholder="Chưa có học kỳ hiện tại"
          className="w-full"
          buttonClassName="h-11 rounded-lg text-sm"
          options={semesterOptions.map((semester) => ({
            value: semester.id,
            label: `${semester.name}${semester.isCurrent ? ' (Hiện tại)' : ''}`,
          }))}
        />

        <label className="flex h-11 min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-slate-600 focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100">
          <Search size={17} className="shrink-0 text-slate-400" />
          <input
            value={keyword}
            onChange={(event) => onKeywordChange(event.target.value)}
            placeholder="Tìm bài thi, môn học hoặc giảng viên..."
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
          />
          {keyword && (
            <button
              type="button"
              onClick={() => onKeywordChange('')}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              aria-label="Xóa từ khóa tìm kiếm"
            >
              <X size={14} />
            </button>
          )}
        </label>

        <div className="grid h-11 w-full grid-cols-2 rounded-lg border border-slate-200 bg-slate-100 p-1" aria-label="Kiểu hiển thị">
          <ViewButton
            active={viewMode === 'CALENDAR'}
            icon={<CalendarDays size={16} />}
            label="Dạng lịch"
            onClick={() => onViewModeChange('CALENDAR')}
          />
          <ViewButton
            active={viewMode === 'LIST'}
            icon={<List size={16} />}
            label="Dạng bảng"
            onClick={() => onViewModeChange('LIST')}
          />
        </div>
      </div>

      <div className="mt-3 flex min-h-9 gap-2 overflow-x-auto pb-0.5" aria-label="Lọc trạng thái bài thi">
        {STUDENT_EXAM_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            className={`h-9 shrink-0 whitespace-nowrap rounded-lg px-3.5 text-xs font-bold transition-colors ${
              filter === item.value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}

function ViewButton({
  active,
  icon,
  label,
  onClick,
}: {
  active: boolean
  icon: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-w-0 items-center justify-center gap-2 whitespace-nowrap rounded-md px-2 text-sm font-semibold transition-colors ${
        active ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
