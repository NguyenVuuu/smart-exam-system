import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CourseExamSchedule } from '../../types/teacher-course.types'
import TeacherPagination from '../TeacherPagination'

export default function CourseExamsTab({ exams, pagination, onPageChange }: {
  exams: CourseExamSchedule[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  onPageChange: (page: number) => void
}) {
  const navigate = useNavigate()

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-900">Danh Sách Bài Thi Của Lớp</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            Theo dõi các bài kiểm tra thường kỳ, giữa kỳ và cuối kỳ được gán cho lớp.
          </p>
        </div>
        <button
          onClick={() => navigate('/teacher/exams/create')}
          className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl flex items-center gap-2 shadow-xs transition-colors"
        >
          <Plus size={18} /> Tạo bài thi mới
        </button>
      </div>

      {exams.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
          Lớp học phần chưa được gán ca thi nào.
        </p>
      ) : exams.map((exam) => (
        <div key={exam.scheduleId} className="p-5 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors">
          <div>
            <h4 className="text-base font-semibold text-gray-900">{exam.title}</h4>
            <p className="text-sm text-gray-500 mt-1">
              {new Date(exam.startTime).toLocaleString('vi-VN')} • {exam.totalPoints} điểm
            </p>
          </div>
          <button
            onClick={() => navigate(`/teacher/exams/${exam.examId}`)}
            className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition-colors"
          >
            Xem đề thi
          </button>
        </div>
      ))}
      <TeacherPagination {...pagination} onChange={onPageChange} />
    </div>
  )
}
