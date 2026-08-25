import {
  CheckCircle2,
  Database,
  Eye,
  RotateCcw,
  Search,
  X,
  XCircle,
} from 'lucide-react'
import { useState } from 'react'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import AdminSidebar from './components/AdminSidebar'
import AdminTopBar from './components/AdminTopBar'

interface PendingQuestionItem {
  id: string
  content: string
  subjectName: string
  teacherName: string
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'PROGRAMMING'
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  submittedAt: string
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'
  explanation?: string
  options?: Array<{ id: string; content: string; isCorrect: boolean }>
  testCases?: Array<{ id: string; input: string; expectedOutput: string }>
}

const MOCK_PENDING_QUESTIONS: PendingQuestionItem[] = [
  {
    id: 'pq-1',
    content: 'Trong Java, từ khóa volatile có tác dụng gì đối với biến trong môi trường đa luồng (Multi-threading)?',
    subjectName: 'Lập trình Java căn bản',
    teacherName: 'TS. Nguyễn Văn Giảng',
    type: 'SINGLE_CHOICE',
    difficulty: 'HARD',
    submittedAt: '24/08/2026 09:15',
    status: 'PENDING_REVIEW',
    explanation: 'Volatile đảm bảo biến luôn được đọc và ghi trực tiếp từ bộ nhớ chính (Main Memory), tránh lưu cache cục bộ của luồng.',
    options: [
      { id: 'o-1', content: 'Khóa biến để chỉ 1 luồng được truy cập tại một thời điểm', isCorrect: false },
      { id: 'o-2', content: 'Đảm bảo tính hiển thị (visibility) của biến giữa các luồng từ Main Memory', isCorrect: true },
      { id: 'o-3', content: 'Biến không thể thay đổi giá trị sau khi gán', isCorrect: false },
      { id: 'o-4', content: 'Tự động đồng bộ hóa tất cả các phương thức liên quan', isCorrect: false },
    ],
  },
  {
    id: 'pq-2',
    content: 'Cài đặt thuật toán Dijkstra tìm đường đi ngắn nhất trên đồ thị có trọng số không âm.',
    subjectName: 'Cấu trúc dữ liệu & Giải thuật',
    teacherName: 'ThS. Trần Thu Hà',
    type: 'PROGRAMMING',
    difficulty: 'HARD',
    submittedAt: '23/08/2026 14:20',
    status: 'PENDING_REVIEW',
    testCases: [
      { id: 'tc-1', input: '5 6\n1 2 2\n1 3 4\n2 3 1\n2 4 7\n3 5 3\n4 5 1\n1 5', expectedOutput: '6' },
    ],
  },
  {
    id: 'pq-3',
    content: 'Đặc điểm nào sau đây là đúng khi nói về con trỏ thông minh std::shared_ptr trong C++11?',
    subjectName: 'Lập trình C++',
    teacherName: 'TS. Lê Hoàng Nam',
    type: 'SINGLE_CHOICE',
    difficulty: 'MEDIUM',
    submittedAt: '22/08/2026 11:30',
    status: 'APPROVED',
  },
]

export default function AdminQuestionApprovalPage() {
  const [questions, setQuestions] = useState<PendingQuestionItem[]>(MOCK_PENDING_QUESTIONS)
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('PENDING_REVIEW')
  const [searchQuery, setSearchQuery] = useState('')
  const [viewingQuestion, setViewingQuestion] = useState<PendingQuestionItem | null>(null)
  const [rejectingQuestion, setRejectingQuestion] = useState<PendingQuestionItem | null>(null)
  const [rejectReasonInput, setRejectReasonInput] = useState('')

  const filteredQuestions = questions.filter((q) => {
    const matchesStatus = statusFilter === 'ALL' || q.status === statusFilter
    const matchesSearch =
      q.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.teacherName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleApprove = (qId: string) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === qId ? { ...q, status: 'APPROVED' } : q)),
    )
    alert('Đã duyệt câu hỏi vào Ngân hàng chung của Môn học thành công!')
    setViewingQuestion(null)
  }

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault()
    if (!rejectingQuestion || !rejectReasonInput.trim()) return

    setQuestions((prev) =>
      prev.map((q) =>
        q.id === rejectingQuestion.id ? { ...q, status: 'REJECTED' } : q,
      ),
    )
    alert(`Đã từ chối câu hỏi đóng góp của Giảng viên ${rejectingQuestion.teacherName}!`)
    setRejectingQuestion(null)
    setRejectReasonInput('')
    setViewingQuestion(null)
  }

  const columns: ColumnDef<PendingQuestionItem>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Nội Dung Câu Hỏi Đóng Góp',
      render: (q) => (
        <div className="space-y-1 py-1">
          <p className="font-semibold text-gray-900 text-xs line-clamp-2 leading-relaxed">{q.content}</p>
          <p className="text-[11px] text-blue-600 font-medium">{q.subjectName}</p>
        </div>
      ),
    },
    {
      header: 'Giảng Viên Đóng Góp',
      width: '160px',
      render: (q) => <span className="text-gray-800 font-medium text-xs">{q.teacherName}</span>,
    },
    {
      header: 'Dạng & Độ Khó',
      width: '140px',
      align: 'center',
      render: (q) => (
        <div className="space-y-0.5">
          <span className="text-[11px] text-gray-600 font-medium block">
            {q.type === 'PROGRAMMING' ? 'Lập trình' : 'Trắc nghiệm'}
          </span>
          <span
            className={`inline-block px-2 py-0.5 text-[9px] font-bold rounded-full ${
              q.difficulty === 'EASY'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : q.difficulty === 'MEDIUM'
                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
            }`}
          >
            {q.difficulty}
          </span>
        </div>
      ),
    },
    {
      header: 'Ngày Gửi',
      width: '130px',
      align: 'center',
      render: (q) => <span className="text-[11px] text-gray-500">{q.submittedAt}</span>,
    },
    {
      header: 'Trạng Thái',
      width: '140px',
      align: 'center',
      render: (q) => (
        <span
          className={`whitespace-nowrap px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
            q.status === 'APPROVED'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : q.status === 'PENDING_REVIEW'
              ? 'bg-amber-50 text-amber-700 border border-amber-200'
              : 'bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {q.status === 'APPROVED'
            ? 'Ngân hàng chung'
            : q.status === 'PENDING_REVIEW'
            ? 'Chờ duyệt'
            : 'Từ chối'}
        </span>
      ),
    },
    {
      header: 'Thao Tác',
      width: '140px',
      align: 'center',
      render: (q) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => setViewingQuestion(q)}
            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
          >
            <Eye size={13} /> Xem xét
          </button>
          {q.status === 'PENDING_REVIEW' && (
            <button
              onClick={() => handleApprove(q.id)}
              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg transition-colors cursor-pointer"
              title="Duyệt nhanh vào Ngân hàng chung"
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
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Duyệt Ngân Hàng Câu Hỏi Chung</h1>
              <p className="text-xs text-gray-500 mt-1">
                Thẩm định chất lượng câu hỏi do Giảng viên đóng góp trước khi đưa vào Ngân hàng đề chung của Bộ môn
              </p>
            </div>

            <div className="flex items-center gap-2">
              {(['PENDING_REVIEW', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#10b981] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {st === 'PENDING_REVIEW'
                    ? 'Chờ duyệt'
                    : st === 'APPROVED'
                    ? 'Đã vào Bank chung'
                    : st === 'REJECTED'
                    ? 'Đã từ chối'
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
                placeholder="Tìm kiếm theo Nội dung câu hỏi, Môn học, Giảng viên..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-[#10b981]"
              />
            </div>

            <button
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('PENDING_REVIEW')
              }}
              className="px-3.5 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RotateCcw size={14} className="text-gray-500" />
              Làm Mới
            </button>
          </div>

          {/* DataTable */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <DataTable
              columns={columns}
              data={filteredQuestions}
              keyExtractor={(q) => q.id}
              emptyText="Không có câu hỏi nào cần duyệt trong danh mục này."
            />
          </div>
        </main>
      </div>

      {/* Review Modal */}
      {viewingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto font-sans">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Database size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Thẩm Định Câu Hỏi Đóng Góp</h3>
                  <p className="text-[11px] text-gray-500">{viewingQuestion.subjectName} • Gửi bởi {viewingQuestion.teacherName}</p>
                </div>
              </div>
              <button onClick={() => setViewingQuestion(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-600 block tracking-wide">Đề bài:</span>
                <p className="text-sm font-semibold text-gray-900 leading-relaxed">{viewingQuestion.content}</p>
              </div>

              {viewingQuestion.options && (
                <div className="space-y-2">
                  <span className="font-bold text-gray-700 block">Danh sách phương án:</span>
                  <div className="space-y-1.5">
                    {viewingQuestion.options.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2.5 rounded-xl border flex items-center justify-between ${
                          opt.isCorrect
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                            : 'bg-white border-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{opt.content}</span>
                        {opt.isCorrect && (
                          <span className="text-[10px] font-bold bg-emerald-200/70 text-emerald-800 px-2 py-0.5 rounded-md">
                            Đáp án đúng
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {viewingQuestion.explanation && (
                <div className="p-3 bg-blue-50/50 border border-blue-100 rounded-xl text-blue-900">
                  <strong>Lời giải thích:</strong> {viewingQuestion.explanation}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <button
                onClick={() => {
                  setRejectingQuestion(viewingQuestion)
                  setRejectReasonInput('')
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors border border-slate-200 flex items-center gap-1.5 cursor-pointer"
              >
                <XCircle size={14} /> Từ chối câu hỏi
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewingQuestion(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Đóng
                </button>
                <button
                  onClick={() => handleApprove(viewingQuestion.id)}
                  className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 size={15} /> Duyệt vào Ngân hàng chung
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {rejectingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-gray-900">Lý Do Từ Chối Câu Hỏi</h3>
            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                rows={3}
                required
                placeholder="Nhập lý do từ chối (Ví dụ: Trùng với câu số 12 trong ngân hàng, đáp án chưa chính xác...)"
                value={rejectReasonInput}
                onChange={(e) => setRejectReasonInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-[#10b981]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingQuestion(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-bold rounded-xl cursor-pointer"
                >
                  Xác nhận từ chối
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
