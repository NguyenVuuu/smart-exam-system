import { FileCheck, Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { CourseExamSchedule } from '../../types/teacher-course.types'
import TeacherPagination from '../TeacherPagination'

export default function CourseExamsTab({ courseOfferingId, exams, pagination, onPageChange }: {
  courseOfferingId: string
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
      ) : exams.map((exam) => {
        const canReview = canReviewSubmissions(exam)
        return (
          <div
            key={exam.scheduleId}
            className="flex items-center justify-between gap-4 rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50"
          >
            <div className="min-w-0">
              <h4 className="max-w-[560px] truncate text-sm font-semibold leading-5 text-gray-900" title={exam.title}>
                {exam.title}
              </h4>
              <p className="mt-1 text-xs text-gray-500">
                {exam.startTime ? new Date(exam.startTime).toLocaleString('vi-VN') : 'Chưa xếp lịch'} • {exam.totalPoints ?? 0} điểm
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => navigate(`/teacher/exams/${exam.examId}`)}
                className="px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors"
              >
                Xem đề thi
              </button>
              <button
                disabled={!canReview}
                onClick={() => navigate(`/teacher/courses/${courseOfferingId}/exams/${exam.examId}/submissions?scheduleId=${encodeURIComponent(exam.scheduleId)}`)}
                title={canReview ? 'Xem bài nộp và xử lý phúc khảo' : 'Chỉ mở sau khi ca thi kết thúc'}
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
              >
                <FileCheck size={14} /> Bài nộp / Phúc khảo
              </button>
            </div>
          </div>
        )
      })}
      <TeacherPagination {...pagination} onChange={onPageChange} />
    </div>
  )
}

function canReviewSubmissions(exam: CourseExamSchedule) {
  if (!exam) return false
  return exam.status === 'CLOSED'
    || (!['DRAFT', 'CANCELLED'].includes(exam.status) && Boolean(exam.endTime) && new Date(exam.endTime).getTime() <= Date.now())
}
