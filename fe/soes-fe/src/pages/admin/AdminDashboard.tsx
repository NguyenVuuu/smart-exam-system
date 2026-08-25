import {
  ArrowRight,
  CheckCircle2,
  Database,
  FileCheck,
  GraduationCap,
  Users,
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import AdminSidebar from './components/AdminSidebar'
import AdminTopBar from './components/AdminTopBar'

export default function AdminDashboard() {
  const navigate = useNavigate()

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Welcome Banner - Emerald Green Theme */}
          <div className="bg-gradient-to-r from-[#10b981] via-[#059669] to-[#047857] rounded-2xl p-7 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-2xl">
              <span className="px-2.5 py-1 bg-white/20 text-white rounded-full text-[11px] font-medium tracking-wide uppercase">
                Kỳ Khảo Thí Học Kỳ 1 • 2026
              </span>
              <h1 className="text-2xl font-bold mt-2 tracking-tight flex items-center gap-2">
                Bảng Điều Khiển Khảo Thí & Quản Trị Hệ Thống
              </h1>
              <p className="text-xs text-emerald-100 mt-1 leading-relaxed">
                Hệ thống ghi nhận 2 đề thi Cuối kỳ và 3 câu hỏi đóng góp đang chờ Ban Khảo thí thẩm định phê duyệt.
              </p>

              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button
                  onClick={() => navigate('/admin/exam-approvals')}
                  className="px-4 py-2 bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <FileCheck size={15} />
                  Thẩm Định Đề Thi (2)
                </button>
                <button
                  onClick={() => navigate('/admin/question-approvals')}
                  className="px-4 py-2 bg-emerald-800/60 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center gap-1.5 border border-white/20 cursor-pointer"
                >
                  <Database size={15} />
                  Duyệt Ngân Hàng Chung (3)
                </button>
              </div>
            </div>
          </div>

          {/* Stat KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div
              onClick={() => navigate('/admin/exam-approvals')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-emerald-300 transition-all"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Đề Thi Chờ Duyệt</p>
                <p className="text-2xl font-bold text-emerald-600">2 đề</p>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 size={12} /> Đề thi Cuối kỳ cần duyệt
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileCheck size={20} />
              </div>
            </div>

            <div
              onClick={() => navigate('/admin/question-approvals')}
              className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-teal-300 transition-all"
            >
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Câu Hỏi Chờ Thẩm Định</p>
                <p className="text-2xl font-bold text-teal-600">3 câu</p>
                <p className="text-[11px] text-teal-700 font-medium flex items-center gap-1">
                  <Database size={12} /> Đóng góp Ngân hàng chung
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Database size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Lớp Học Phần Đang Mở</p>
                <p className="text-2xl font-bold text-gray-900">12 lớp</p>
                <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                  <GraduationCap size={12} /> Đã phân công giảng viên
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <GraduationCap size={20} />
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">Tổng Sinh Viên Ghi Danh</p>
                <p className="text-2xl font-bold text-gray-900">540 SV</p>
                <p className="text-[11px] text-gray-400">Dữ liệu đào tạo chính thức</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Users size={20} />
              </div>
            </div>
          </div>

          {/* Quick Approval Queue Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Danh Sách Đề Thi Gửi Phê Duyệt Gần Đây</h3>
                <p className="text-xs text-gray-500">Các đề thi Cuối kỳ do Giảng viên gửi lên chờ Ban Khảo thí phê duyệt</p>
              </div>
              <button
                onClick={() => navigate('/admin/exam-approvals')}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
              >
                Xem tất cả <ArrowRight size={13} />
              </button>
            </div>

            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                      CUỐI KỲ (FINAL)
                    </span>
                    <h4 className="font-bold text-xs text-gray-900">Đề Thi Cuối Kỳ Lập Trình Java - Học Kỳ 1 2026</h4>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Môn: <strong>Lập trình Java căn bản</strong> • Soạn bởi: <strong>TS. Nguyễn Văn Giảng</strong> • Gửi lúc 08:30 hôm nay
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/exam-approvals')}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Thẩm định ngay
                </button>
              </div>

              <div className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50 transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md border border-emerald-100">
                      CUỐI KỲ (FINAL)
                    </span>
                    <h4 className="font-bold text-xs text-gray-900">Đề Thi Cuối Kỳ Cấu Trúc Dữ Liệu & Giải Thuật</h4>
                  </div>
                  <p className="text-[11px] text-gray-500">
                    Môn: <strong>Cấu trúc dữ liệu & Giải thuật</strong> • Soạn bởi: <strong>ThS. Trần Thu Hà</strong> • Gửi lúc 15:45 hôm qua
                  </p>
                </div>
                <button
                  onClick={() => navigate('/admin/exam-approvals')}
                  className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  Thẩm định ngay
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
