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
    <div className="border-b border-gray-100 bg-white p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <AppSelect
            value={semesterId}
            onChange={onSemesterChange}
            disabled={semesterOptions.length === 0 || disabled}
            placeholder="Chưa có học kỳ hiện tại"
            className="w-full sm:w-64"
            buttonClassName="h-10 rounded-xl text-sm"
            options={semesterOptions.map((semester) => ({
              value: semester.id,
              label: `${semester.name}${semester.isCurrent ? ' (Hiện tại)' : ''}`,
            }))}
          />

          <div className="flex h-10 w-full min-w-[240px] sm:w-72 items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-slate-600 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
            <Search size={16} className="shrink-0 text-slate-400" />
            <input
              value={keyword}
              onChange={(event) => onKeywordChange(event.target.value)}
              placeholder="Tìm bài thi, môn học..."
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
            {keyword && (
              <button
                type="button"
                onClick={() => onKeywordChange('')}
                className="shrink-0 rounded-lg p-1 text-slate-400 hover:bg-gray-100 hover:text-slate-700 cursor-pointer"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center rounded-xl border border-gray-200 bg-gray-100/70 p-1 shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => onViewModeChange('CALENDAR')}
            className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all cursor-pointer ${
              viewMode === 'CALENDAR'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays size={16} />
            <span>Dạng Lịch</span>
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('LIST')}
            className={`flex h-9 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold transition-all cursor-pointer ${
              viewMode === 'LIST'
                ? 'bg-white text-blue-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List size={16} />
            <span>Dạng Bảng</span>
          </button>
        </div>
      </div>

      <div className="mt-3 flex min-h-9 gap-2 overflow-x-auto pb-0.5" aria-label="Lọc trạng thái bài thi">
        {STUDENT_EXAM_FILTERS.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onFilterChange(item.value)}
            className={`h-8 shrink-0 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition-all cursor-pointer ${
              filter === item.value
                ? 'bg-blue-600 text-white shadow-xs font-bold'
                : 'bg-gray-100 text-slate-600 hover:bg-gray-200/80 hover:text-slate-900'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
