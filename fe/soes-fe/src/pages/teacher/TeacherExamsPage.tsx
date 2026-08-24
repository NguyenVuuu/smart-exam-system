import { Copy, Edit, Eye, Filter, Plus, RotateCcw, Search, Trash2, UserCheck, UserX, X } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import CreateExamTypeModal from './components/exam-detail/CreateExamTypeModal'
import { MOCK_EXAMS } from './mock/teacher-exam.mock'
import type { Exam } from './types/teacher-exam.types'

const examStatusTone = {
  DRAFT: 'amber',
  PUBLISHED: 'emerald',
  CLOSED: 'gray',
} as const

export default function TeacherExamsPage() {
  const navigate = useNavigate()
  const [exams, setExams] = useState<Exam[]>(MOCK_EXAMS)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatus('ALL')
  }

  const filteredExams = exams.filter((e) => {
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const handleDeleteExam = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    if (exam.status !== 'DRAFT') {
      alert('Chỉ có thể xóa đề thi ở trạng thái Nháp. Đề đã công bố hoặc đã đóng nên chuyển trạng thái/lưu trữ để bảo toàn dữ liệu bài làm.')
      return
    }

    if (confirm('Bạn có chắc chắn muốn xóa đề thi này không?')) {
      setExams(exams.filter((item) => item.id !== exam.id))
    }
  }

  const handleCopyExam = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/teacher/exams/create?copyFrom=${exam.id}`)
  }

  const handleToggleStudentVisibility = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    setExams((prev) =>
      prev.map((item) =>
        item.id === exam.id
          ? {
              ...item,
              studentVisibility: item.studentVisibility === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN',
            }
          : item,
      ),
    )
  }

  // Columns definition
  const columns: ColumnDef<Exam>[] = [
    {
      header: 'STT',
      width: '50px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'Tên Đề Thi / Bài Kiểm Tra',
      render: (e) => (
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-gray-900 text-xs">{e.title}</p>
            {e.status !== 'DRAFT' && e.studentVisibility === 'HIDDEN' && (
              <AppBadge className="font-medium">
                <UserX size={11} /> Đã ẩn khỏi SV
              </AppBadge>
            )}
          </div>
          <p className="text-[11px] text-gray-500">
            Môn học: {e.subjectName}
          </p>
        </div>
      ),
    },
    {
      header: 'Cấu Trúc Câu Hỏi',
      width: '160px',
      render: (e) => (
        <AppBadge tone="blue" shape="rounded" className="py-1 text-xs">
          {e.type === 'MULTIPLE_CHOICE'
            ? 'Trắc nghiệm'
            : e.type === 'PROGRAMMING'
            ? 'Lập trình Code'
            : 'Hỗn hợp'}
        </AppBadge>
      ),
    },
    {
      header: <span className="whitespace-nowrap">Câu Hỏi</span>,
      width: '120px',
      align: 'center',
      render: (e) => (
        <span className="font-medium text-gray-700 text-xs">{e.questions?.length || 0} câu</span>
      ),
    },
    {
      header: 'Thời Gian',
      width: '160px',
      render: (e) => (
        <div>
          <p className="font-semibold text-gray-800 text-xs">{e.durationMinutes} phút</p>
          <p className="text-[10px] text-gray-400">{e.startTime}</p>
        </div>
      ),
    },
    {
      header: 'Trạng Thái',
      width: '120px',
      align: 'center',
      render: (e) => <AppBadge tone={examStatusTone[e.status]}>{e.status}</AppBadge>,
    },
    {
      header: 'Thao Tác',
      width: '110px',
      align: 'right',
      render: (e) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={(ev) => {
              ev.stopPropagation()
              navigate(`/teacher/exams/${e.id}`)
            }}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Xem chi tiết đề thi và trạng thái bài thi"
          >
            <Eye size={16} />
          </button>
          {e.status === 'DRAFT' && (
            <button
              onClick={(ev) => {
                ev.stopPropagation()
                navigate(`/teacher/exams/${e.id}/edit`)
              }}
              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Sửa cấu hình đề thi nháp"
            >
              <Edit size={16} />
            </button>
          )}
          <button
            onClick={(ev) => handleCopyExam(e, ev)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sao chép đề thành bản nháp mới"
          >
            <Copy size={16} />
          </button>
          {e.status !== 'DRAFT' && (
            <button
              onClick={(ev) => handleToggleStudentVisibility(e, ev)}
              className={`p-1.5 rounded-lg transition-colors ${
                e.studentVisibility === 'HIDDEN'
                  ? 'text-gray-500 hover:text-emerald-600 hover:bg-emerald-50'
                  : 'text-gray-500 hover:text-amber-600 hover:bg-amber-50'
              }`}
              title={e.studentVisibility === 'HIDDEN' ? 'Hiện lại đề cho sinh viên' : 'Ẩn đề khỏi trang sinh viên'}
            >
              {e.studentVisibility === 'HIDDEN' ? <UserCheck size={16} /> : <UserX size={16} />}
            </button>
          )}
          {e.status === 'DRAFT' && (
            <button
              onClick={(ev) => handleDeleteExam(e, ev)}
              className="p-1.5 text-gray-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Xóa đề thi nháp"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TeacherPageHeader
            title="Quản Lý Đề Thi & Bài Kiểm Tra"
            description="Tạo và công bố đề thi trắc nghiệm, lập trình, hỗn hợp"
            actions={
              <button
                onClick={() => setIsTypeModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Tạo Đề Thi Mới
              </button>
            }
          />

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 overflow-x-auto whitespace-nowrap">
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex items-center gap-2">
                <Filter size={15} className="text-gray-400 shrink-0" />
                <span className="text-xs font-bold text-gray-700">Trạng thái:</span>
                <AppSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  className="w-44"
                  buttonClassName="bg-blue-50/70 border-blue-200 text-blue-900 py-1.5"
                  options={[
                    { value: 'ALL', label: 'Tất cả trạng thái' },
                    { value: 'DRAFT', label: 'Nháp (DRAFT)' },
                    { value: 'PUBLISHED', label: 'Công bố (PUBLISHED)' },
                    { value: 'CLOSED', label: 'Đóng đề (CLOSED)' },
                  ]}
                />
              </div>

              <button
                onClick={handleResetFilters}
                className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-colors flex items-center gap-1 shrink-0"
              >
                <RotateCcw size={13} /> Làm mới
              </button>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 flex items-center gap-2 w-48 sm:w-60 lg:w-72 shrink-0">
              <Search size={15} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Tìm tên đề thi, môn học..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs font-medium focus:outline-none text-gray-800 w-full"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600 shrink-0">
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Reusable DataTable Component */}
          <DataTable
            columns={columns}
            data={filteredExams}
            keyExtractor={(e) => e.id}
            emptyText="Chưa có đề thi nào được khởi tạo"
            pageSize={10}
            onRowClick={(e) => navigate(`/teacher/exams/${e.id}`)}
          />
        </main>
      </div>

      {/* Modal chọn loại đề */}
      <CreateExamTypeModal
        isOpen={isTypeModalOpen}
        onClose={() => setIsTypeModalOpen(false)}
        onSelectType={(selectedType) => {
          navigate(`/teacher/exams/create?type=${selectedType}`)
        }}
      />
    </div>
  )
}
