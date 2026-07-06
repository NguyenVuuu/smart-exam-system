import { BookOpen, ClipboardList, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { SubjectCard as SubjectCardType } from '../types/subjects.types'

interface SubjectCardProps {
  subject: SubjectCardType
}

export default function SubjectCard({ subject }: SubjectCardProps) {
  const navigate = useNavigate()

  function handleNavigate() {
    navigate(`/student/courses/${subject.courseOfferingId}`)
  }

  return (
    <div
      onClick={handleNavigate}
      className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-4 cursor-pointer hover:shadow-md hover:border-blue-100 transition-all"
    >
      {/* Subject info */}
      <div className="flex-1">
        <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">
          {subject.subjectCode}
        </p>
        <h3 className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">
          {subject.subjectName}
        </h3>
        <div className="flex items-center gap-1.5 mt-2 text-xs text-gray-500">
          <User size={13} className="shrink-0" />
          <span className="truncate">{subject.teacherName}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <BookOpen size={13} />
          <span>{subject.materialCount} tài liệu</span>
        </div>
        <div className="flex items-center gap-1">
          <ClipboardList size={13} />
          <span>{subject.examCount} bài thi</span>
        </div>
      </div>

      {/* Action */}
      <button
        onClick={(e) => { e.stopPropagation(); handleNavigate() }}
        className="w-full py-2 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
      >
        Vào môn học
      </button>
    </div>
  )
}
