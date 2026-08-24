import {
  CheckCircle2,
  Clock,
  Eye,
  FileCheck,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import AdminSidebar from './components/AdminSidebar'
import AdminTopBar from './components/AdminTopBar'

interface PendingExamItem {
  id: string
  title: string
  subjectName: string
  teacherName: string
  category: 'FINAL' | 'MIDTERM'
  submittedAt: string
  totalQuestions: number
  totalPoints: number
  durationMinutes: number
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  questions: Array<{
    id: string
    content: string
    type: string
    difficulty: string
    points: number
  }>
}

const MOCK_PENDING_EXAMS: PendingExamItem[] = [
  {
    id: 'p-exam-01',
    title: 'Đề Thi Cuối Kỳ Lập Trình Java - Học Kỳ 1 2026',
    subjectName: 'Lập trình Java căn bản',
    teacherName: 'TS. Nguyễn Văn Giảng',
    category: 'FINAL',
    submittedAt: '24/08/2026 08:30',
    totalQuestions: 20,
    totalPoints: 10.0,
    durationMinutes: 90,
    status: 'PENDING_APPROVAL',
    questions: [
      { id: 'q-1', content: 'Giải thích tính đóng gói và kế thừa trong Java OOP.', type: 'Tự luận', difficulty: 'MEDIUM', points: 3.0 },
      { id: 'q-2', content: 'Viết chương trình tính tổng mảng số nguyên bằng Stream API.', type: 'Lập trình Console', difficulty: 'HARD', points: 4.0 },
      { id: 'q-3', content: 'Từ khóa nào ngăn chặn việc override phương thức?', type: 'Trắc nghiệm', difficulty: 'EASY', points: 3.0 },
    ],
  },
  {
    id: 'p-exam-02',
    title: 'Đề Thi Cuối Kỳ Cấu Trúc Dữ Liệu & Giải Thuật',
    subjectName: 'Cấu trúc dữ liệu & Giải thuật',
    teacherName: 'ThS. Trần Thu Hà',
    category: 'FINAL',
    submittedAt: '23/08/2026 15:45',
    totalQuestions: 25,
    totalPoints: 10.0,
    durationMinutes: 90,
    status: 'PENDING_APPROVAL',
    questions: [
      { id: 'q-1', content: 'Độ phức tạp thuật toán QuickSort trong trường hợp xấu nhất là gì?', type: 'Trắc nghiệm', difficulty: 'MEDIUM', points: 2.0 },
      { id: 'q-2', content: 'Cài đặt cây nhị phân tìm kiếm (BST) và viết hàm duyệt inorder.', type: 'Lập trình Console', difficulty: 'HARD', points: 8.0 },
    ],
  },
  {
    id: 'p-exam-03',
    title: 'Đề Thi Giữa Kỳ Lập Trình C++ Nâng Cao',
    subjectName: 'Lập trình C++',
    teacherName: 'TS. Lê Hoàng Nam',
    category: 'MIDTERM',
    submittedAt: '20/08/2026 10:00',
    totalQuestions: 15,
    totalPoints: 10.0,
    durationMinutes: 60,
    status: 'APPROVED',
    questions: [],
  },
]

export default function AdminExamApprovalPage() {
  const [exams, setExams] = useState<PendingExamItem[]>(MOCK_PENDING_EXAMS)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED'>('PENDING_APPROVAL')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingExam, setViewingExam] = useState<PendingExamItem | null>(null)
  const [rejectingExam, setRejectingExam] = useState<PendingExamItem | null>(null)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  const filteredExams = exams.filter((ex) => {
    const matchesStatus = statusFilter === 'ALL' || ex.status === statusFilter
    const matchesSearch =
      ex.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleApproveExam = (examId: string) => {
    setExams((prev) =>
      prev.map((ex) => (ex.id === examId ? { ...ex, status: 'APPROVED' } : ex)),
    )
    alert('Đã phê duyệt đề thi thành công! Đề thi đã sẵn sàng để gán cho các ca thi của lớp học phần.')
    setViewingExam(null)
  }

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingExam || !rejectReasonInput.trim()) return

    setExams((prev) =>
      prev.map((ex) =>
        ex.id === rejectingExam.id
          ? {
              ...ex,
              status: 'REJECTED',
              rejectionReason: rejectReasonInput.trim(),
            }
          : ex,
      ),
    )
    alert(`Đã gửi yêu cầu chỉnh sửa đề thi tới Giảng viên ${rejectingExam.teacherName}!`)
    setRejectingExam(null)
    setRejectReasonInput('')
    setViewingExam(null)
  }

  const columns: ColumnDef<PendingExamItem>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Tên Đề Thi & Môn Học',
      render: (ex) => (
        <div className="space-y-0.5 py-1">
          <p className="font-bold text-gray-900 text-xs">{ex.title}</p>
          <p className="text-[11px] text-blue-600 font-medium">{ex.subjectName}</p>
        </div>
      ),
    },
    {
      header: 'Giảng Viên Soạn Đề',
      width: '160px',
      render: (ex) => <span className="text-gray-800 font-medium text-xs">{ex.teacherName}</span>,
    },
    {
      header: 'Cấu Trúc Đề',
      width: '130px',
      align: 'center',
      render: (ex) => (
        <span className="text-xs text-gray-600 font-medium">
          {ex.totalQuestions} câu • {ex.durationMinutes}p
        </span>
      ),
    },
    {
      header: 'Ngày Gửi Duyệt',
      width: '140px',
      align: 'center',
      render: (ex) => <span className="text-[11px] text-gray-500">{ex.submittedAt}</span>,
    },
    {
      header: 'Trạng Thái',
      width: '140px',
      align: 'center',
      render: (ex) => (
        <span
          className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
            ex.status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : ex.status === 'PENDING_APPROVAL'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-rose-50 text-rose-700 border border-rose-200'
          }`}
        >
          {ex.status === 'APPROVED'
            ? 'Đã duyệt'
            : ex.status === 'PENDING_APPROVAL'
            ? 'Chờ duyệt'
            : 'Bị từ chối'}
        </span>
      ),
    },
    {
      header: 'Thao Tác',
      width: '150px',
      align: 'center',
      render: (ex) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setViewingExam(ex)}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
          >
            <Eye size={13} /> Thẩm định
          </button>
          {ex.status === 'PENDING_APPROVAL' && (
            <button
              onClick={() => handleApproveExam(ex.id)}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors"
              title="Duyệt nhanh"
            >
              <CheckCircle2 size={15} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <AdminSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <AdminTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Thẩm Định & Phê Duyệt Đề Thi</h1>
              <p className="text-xs text-gray-500 mt-1">
                Xem xét chất lượng, ma trận câu hỏi và phê duyệt các đề thi Cuối kỳ / Chuẩn hóa do Giảng viên gửi lên
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['PENDING_APPROVAL', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all ${
                    statusFilter === st
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {st === 'PENDING_APPROVAL'
                    ? 'Chờ thẩm định'
                    : st === 'APPROVED'
                    ? 'Đã duyệt'
                    : st === 'REJECTED'
                    ? 'Bị từ chối'
                    : 'Tất cả'}
                </button>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo Tên đề thi, Môn học, Giảng viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-rose-500"
              />
            </div>

            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('PENDING_APPROVAL')
              }}
              className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Clock size={14} className="text-gray-500" />
              Làm Mới
            </button>
          </div>

          {/* DataTable */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <DataTable
              columns={columns}
              data={filteredExams}
              keyExtractor={(ex) => ex.id}
              emptyText="Không có đề thi nào trong danh sách thẩm định này."
            />
          </div>
        </main>
      </div>

      {/* Viewing & Approval Modal */}
      {viewingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-hidden font-sans">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl animate-in fade-in zoom-in-95 duration-150 border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <FileCheck size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Thẩm Định Nội Dung Đề Thi</h3>
                  <p className="text-[11px] text-gray-500">{viewingExam.subjectName} • Soạn bởi {viewingExam.teacherName}</p>
                </div>
              </div>
              <button onClick={() => setViewingExam(null)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-gray-50/50">
              <div className="bg-white p-4 rounded-xl border border-gray-100 space-y-2 text-xs shadow-2xs">
                <h4 className="font-bold text-gray-900 text-sm">{viewingExam.title}</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-gray-600">
                  <div>Thời lượng: <strong className="text-gray-900">{viewingExam.durationMinutes} phút</strong></div>
                  <div>Tổng điểm: <strong className="text-gray-900">{viewingExam.totalPoints}đ</strong></div>
                  <div>Loại bài thi: <strong className="text-gray-900">{viewingExam.category}</strong></div>
                  <div>Ngày gửi: <strong className="text-gray-900">{viewingExam.submittedAt}</strong></div>
                </div>
              </div>

              {/* Questions Sample */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wide">Danh Sách Câu Hỏi Trong Đề:</h4>
                <div className="border border-gray-100 rounded-xl divide-y divide-gray-100 overflow-hidden bg-white shadow-2xs">
                  {viewingExam.questions.length > 0 ? (
                    viewingExam.questions.map((q, idx) => (
                      <div key={q.id} className="p-4 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-blue-600">Câu {idx + 1} ({q.points} điểm)</span>
                          <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md font-semibold">
                            {q.type} • {q.difficulty}
                          </span>
                        </div>
                        <p className="text-gray-800 font-medium leading-relaxed">{q.content}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-gray-400">
                      Bộ đề gồm {viewingExam.totalQuestions} câu hỏi đã được cấu hình ma trận chuẩn.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-3.5 bg-white flex items-center justify-between shrink-0 border-t border-gray-100">
              <button
                onClick={() => {
                  setRejectingExam(viewingExam)
                  setRejectReasonInput('')
                }}
                className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs rounded-xl transition-colors border border-rose-200 flex items-center gap-1.5"
              >
                <XCircle size={14} /> Từ chối / Yêu cầu sửa
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingExam(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Đóng
                </button>
                <button
                  onClick={() => handleApproveExam(viewingExam.id)}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} /> Phê duyệt đề thi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingExam && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900">Lý Do Từ Chối & Yêu Cầu Chỉnh Sửa</h3>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                rows={4}
                required
                placeholder="Nhập chi tiết yêu cầu giảng viên cần sửa (Ví dụ: Cần tăng độ khó ở phần 2, kiểm tra lại test case câu 3...)"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-rose-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingExam(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl"
                >
                  Xác nhận gửi từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
