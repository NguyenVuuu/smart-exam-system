import { RotateCcw, Search, X } from 'lucide-react'
import type { SemesterOption } from '../types/subjects.types'

interface SubjectsToolbarProps {
  keyword: string
  onKeywordChange: (v: string) => void
  semesterOptions: SemesterOption[]
  selectedSemesterId: string | null
  onSemesterChange: (id: string) => void
}

export default function SubjectsToolbar({
  keyword,
  onKeywordChange,
  semesterOptions,
  selectedSemesterId,
  onSemesterChange,
}: SubjectsToolbarProps) {
  const handleReset = () => {
    onKeywordChange('')
    if (semesterOptions.length > 0) {
      onSemesterChange(semesterOptions[0].id)
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1 w-full">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Tìm kiếm môn học..."
          className="w-full pl-9 pr-8 py-2.5 text-xs border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 font-medium"
        />
        {keyword && (
          <button
            onClick={() => onKeywordChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Semester filter */}
      {semesterOptions.length > 0 && (
        <select
          value={selectedSemesterId ?? ''}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="text-xs border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 font-medium focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400 shrink-0"
        >
          {semesterOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}{s.isCurrent ? ' (Hiện tại)' : ''}
            </option>
          ))}
        </select>
      )}

      {/* Reset Button */}
      <button
        onClick={handleReset}
        className="px-3.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 shrink-0"
        title="Làm mới tìm kiếm và lọc"
      >
        <RotateCcw size={13} /> Làm mới
      </button>
    </div>
  )
}
