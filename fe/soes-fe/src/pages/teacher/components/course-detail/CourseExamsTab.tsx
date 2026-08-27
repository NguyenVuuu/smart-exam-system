import { Plus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function CourseExamsTab() {
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

      <div className="p-5 border border-gray-100 rounded-2xl flex items-center justify-between hover:bg-gray-50 transition-colors">
        <div>
          <h4 className="text-base font-semibold text-gray-900">Bài Thi Giữa Kỳ Java</h4>
          <p className="text-sm text-gray-500 mt-1">60 phút • 3 câu hỏi (10 điểm)</p>
        </div>
        <button
          onClick={() => navigate('/teacher/exams/exam-01')}
          className="px-5 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm rounded-xl transition-colors"
        >
          Xem bài nộp
        </button>
      </div>
    </div>
  )
}
