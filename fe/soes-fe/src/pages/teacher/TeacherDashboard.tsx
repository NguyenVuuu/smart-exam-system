import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Database,
  FileCheck,
  FileSpreadsheet,
  FileText,
  Layers,
  ShieldAlert,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { MOCK_TEACHER_COURSES } from './mock/teacher-course.mock'

export default function TeacherDashboard() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-7 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-xs font-medium tracking-wide uppercase">
                Học kỳ 1 • 2026
              </span>
              <h1 className="text-2xl font-bold mt-2 tracking-tight">
                Xin chào, TS. Nguyễn Văn Giảng! 👋
              </h1>
              <p className="text-xs text-blue-100 mt-1 leading-relaxed">
                Hệ thống SOES ghi nhận 2 bài thi sắp diễn ra, ca thi trực tuyến đang mở và 2 cảnh báo cần rà soát.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  onClick={() => navigate('/teacher/proctoring')}
                  className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <ShieldAlert size={15} />
                  Giám sát Ca Thi Live
                </button>
                <button
                  onClick={() => navigate('/teacher/exams/auto-generator')}
                  className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 font-semibold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Layers size={15} className="text-blue-600" />
                  Sinh đề tự động
                </button>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Lớp HP Phụ Trách</p>
                <p className="text-2xl font-bold text-gray-900">3</p>
                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <span>● 2 lớp đang mở</span>
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <BookOpen size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Tổng Sinh Viên</p>
                <p className="text-2xl font-bold text-gray-900">133</p>
                <p className="text-xs text-gray-400">Đã ghi danh kỳ này</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Câu Hỏi Cần Rà Soát</p>
                <p className="text-2xl font-bold text-rose-600">4</p>
                <p className="text-xs text-rose-600 font-medium">Thiếu đáp án/test case/giải thích</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertCircle size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Kỳ Thi Đã Công Bố</p>
                <p className="text-2xl font-bold text-emerald-600">2</p>
                <p className="text-xs text-emerald-600 font-medium">Đã mở cho SV làm bài</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
            </div>
          </div>

          {/* Quick Actions Bar */}
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-3">
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Chức Năng Nhanh Cho Giảng Viên</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
              <button
                onClick={() => navigate('/teacher/question-bank')}
                className="p-3 bg-gray-50 hover:bg-blue-50/60 border border-gray-200/60 hover:border-blue-200 rounded-xl transition-all text-left space-y-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <Database size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600">Ngân Hàng Câu Hỏi</p>
                <p className="text-xs text-gray-400">Soạn tay & AI</p>
              </button>

              <button
                onClick={() => navigate('/teacher/question-audit')}
                className="p-3 bg-gray-50 hover:bg-rose-50/60 border border-gray-200/60 hover:border-rose-200 rounded-xl transition-all text-left space-y-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                  <AlertCircle size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-900 group-hover:text-rose-600">Rà Soát Câu Hỏi</p>
                <p className="text-xs text-gray-400">Kiểm tra chất lượng</p>
              </button>

              <button
                onClick={() => navigate('/teacher/exams/auto-generator')}
                className="p-3 bg-gray-50 hover:bg-indigo-50/60 border border-gray-200/60 hover:border-indigo-200 rounded-xl transition-all text-left space-y-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Layers size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-900 group-hover:text-indigo-600">Sinh Đề Tự Động</p>
                <p className="text-xs text-gray-400">Theo tiêu chí</p>
              </button>

              <button
                onClick={() => navigate('/teacher/exams')}
                className="p-3 bg-gray-50 hover:bg-blue-50/60 border border-gray-200/60 hover:border-blue-200 rounded-xl transition-all text-left space-y-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <FileText size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-900 group-hover:text-blue-600">Quản Lý Bài Thi</p>
                <p className="text-xs text-gray-400">Cấu hình & công bố</p>
              </button>

              <button
                onClick={() => navigate('/teacher/proctoring')}
                className="p-3 bg-gray-50 hover:bg-amber-50/60 border border-gray-200/60 hover:border-amber-200 rounded-xl transition-all text-left space-y-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                  <ShieldAlert size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-900 group-hover:text-amber-600">Giám Sát Ca Thi</p>
                <p className="text-xs text-gray-400">Live Proctoring</p>
              </button>

              <button
                onClick={() => navigate('/teacher/grading-reports')}
                className="p-3 bg-gray-50 hover:bg-emerald-50/60 border border-gray-200/60 hover:border-emerald-200 rounded-xl transition-all text-left space-y-1 group"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet size={16} />
                </div>
                <p className="text-xs font-semibold text-gray-900 group-hover:text-emerald-600">Thống Kê Phổ Điểm</p>
                <p className="text-xs text-gray-400">Xuất điểm bài thi</p>
              </button>
            </div>
          </div>

          {/* Active Courses & Proctoring Alert Feed */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Active Courses */}
            <div className="lg:col-span-2 bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold text-gray-900">Lớp Học Phần Đang Phụ Trách</h2>
                <button
                  onClick={() => navigate('/teacher/courses')}
                  className="text-xs text-blue-600 hover:underline flex items-center gap-1 font-medium"
                >
                  Xem tất cả <ArrowRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {MOCK_TEACHER_COURSES.map((course) => (
                  <div
                    key={course.id}
                    onClick={() => navigate(`/teacher/courses/${course.id}`)}
                    className="p-4 border border-gray-100 rounded-xl hover:border-blue-200 hover:shadow-xs cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                        {course.subjectCode.substring(0, 3)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-xs font-bold text-gray-900 hover:text-blue-600">{course.subjectName}</h3>
                          <span className="px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 rounded-md">
                            {course.courseCode}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          Sĩ số: <span className="font-semibold text-gray-700">{course.totalStudents} sinh viên</span> • Học kỳ 1 2026
                        </p>
                      </div>
                    </div>

                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                      <ArrowRight size={16} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Proctoring Warning Feed Sidebar */}
            <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm space-y-4 h-fit">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-500" />
                Cảnh Báo Ca Thi Đang Mở
              </h2>

              <div className="space-y-3">
                <div className="p-3 bg-rose-50/70 border border-rose-100 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-rose-800">
                    <span>Phạm Đức Anh (SV2026003)</span>
                    <span className="text-xs text-rose-600 font-mono">10:14:20</span>
                  </div>
                  <p className="text-xs text-rose-700">Webcam không phát hiện khuôn mặt quá 15 giây.</p>
                </div>

                <div className="p-3 bg-amber-50/70 border border-amber-100 rounded-xl space-y-1">
                  <div className="flex justify-between items-center text-xs font-bold text-amber-800">
                    <span>Trần Minh Nam (SV2026001)</span>
                    <span className="text-xs text-amber-600 font-mono">10:12:05</span>
                  </div>
                  <p className="text-xs text-amber-700">Phát hiện chuyển tab trình duyệt ra ngoài.</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/teacher/proctoring')}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition-colors text-center"
              >
                Vào Phòng Giám Sát Ca Thi →
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
