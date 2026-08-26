import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CourseOffering } from '../../types/teacher-course.types'

export default function CourseDetailBanner({ course }: { course: CourseOffering }) {
  const navigate = useNavigate()

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div className="flex items-start gap-5">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center shadow-md shadow-blue-200">
          {course.subjectCode.substring(0, 3)}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-blue-100 text-blue-700 rounded-md">
              {course.courseCode}
            </span>
            <span className="text-xs text-gray-400">• {course.semesterName}</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-1">
            {course.subjectName}
          </h1>
          <p className="text-sm text-gray-500 mt-1">Giảng viên phụ trách: {course.teacherName}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <button
          onClick={() => navigate('/teacher/question-bank')}
          className="px-5 py-3 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-sm rounded-xl transition-all flex items-center gap-2"
        >
          <Sparkles size={18} className="text-amber-500" />
          AI Sinh câu hỏi từ Lớp HP
        </button>
      </div>
    </div>
  )
}
