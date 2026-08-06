import { BookOpen, User } from 'lucide-react'
import type { CourseHeader as CourseHeaderType } from '../../types/course-detail.types'

interface CourseHeaderProps {
  data: CourseHeaderType
}

export default function CourseHeader({ data }: CourseHeaderProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-6 py-5 mb-5">
      <div className="flex items-start gap-4">
        <div className="flex items-center justify-center w-12 h-12 bg-blue-50 rounded-xl shrink-0">
          <BookOpen size={22} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
            {data.subjectCode}
          </p>
          <h1 className="text-lg font-semibold text-gray-900 leading-snug mb-2">
            {data.subjectName}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1.5">
              <User size={14} className="shrink-0" />
              <span>{data.teacherName}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span className="text-gray-500">{data.courseCode}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
