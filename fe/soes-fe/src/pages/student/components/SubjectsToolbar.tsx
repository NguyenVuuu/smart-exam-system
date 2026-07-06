import { Search } from 'lucide-react'
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
  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={keyword}
          onChange={(e) => onKeywordChange(e.target.value)}
          placeholder="Tìm kiếm môn học..."
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        />
      </div>

      {/* Semester filter */}
      {semesterOptions.length > 0 && (
        <select
          value={selectedSemesterId ?? ''}
          onChange={(e) => onSemesterChange(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
        >
          {semesterOptions.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      )}
    </div>
  )
}
