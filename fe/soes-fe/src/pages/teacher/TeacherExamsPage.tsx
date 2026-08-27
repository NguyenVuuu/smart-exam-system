import { ClipboardList, Copy, Edit, Eye, Plus, Trash2, UserCheck, UserX } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import CreateExamTypeModal from './components/exam-detail/CreateExamTypeModal'
import type { Exam } from './types/teacher-exam.types'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import { getExamCapabilities } from './utils/ExamCapabilities'

const examStatusTone = {
  DRAFT: 'amber',
  PENDING_APPROVAL: 'blue',
  REJECTED: 'rose',
  PUBLISHED: 'emerald',
  LOCKED: 'gray',
  ARCHIVED: 'gray',
} as const

const examStatusLabel = {
  DRAFT: 'Bản nháp',
  PENDING_APPROVAL: 'Chờ duyệt',
  REJECTED: 'Bị từ chối',
  PUBLISHED: 'Đã công bố',
  LOCKED: 'Đã khóa',
  ARCHIVED: 'Đã lưu trữ',
} as const

export default function TeacherExamsPage() {
  const navigate = useNavigate()
  const exams = useTeacherWorkspaceStore((state) => state.exams)
  const removeDraftExam = useTeacherWorkspaceStore((state) => state.removeDraftExam)
  const setExamVisibility = useTeacherWorkspaceStore((state) => state.setExamVisibility)
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
      e.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
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
      removeDraftExam(exam.id)
    }
  }

  const handleCopyExam = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/teacher/exams/create?copyFrom=${exam.id}`)
  }

  const handleToggleStudentVisibility = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    setExamVisibility(exam.id, exam.studentVisibility === 'HIDDEN' ? 'VISIBLE' : 'HIDDEN')
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
            <p className="font-semibold text-gray-900 text-sm">{e.title}</p>
            {e.status !== 'DRAFT' && e.studentVisibility === 'HIDDEN' && (
              <AppBadge className="font-medium whitespace-nowrap">
                <UserX size={11} /> Đã ẩn khỏi SV
              </AppBadge>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Môn học: {e.subjectName}
          </p>
        </div>
      ),
    },
    {
      header: 'Cấu Trúc Câu Hỏi',
      width: '180px',
      render: (e) => (
        <AppBadge tone="blue" shape="rounded" className="py-1 text-xs whitespace-nowrap">
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
      width: '110px',
      align: 'center',
      render: (e) => (
        <span className="text-gray-700 text-sm">{e.questions?.length || 0} câu</span>
      ),
    },
    {
      header: 'Thời Gian',
      width: '150px',
      render: (e) => (
        <span className="whitespace-nowrap text-sm text-gray-800">
          {e.defaultDurationMinutes} phút - {e.schedules?.length ?? 0} ca thi
        </span>
      ),
    },
    {
      header: 'Trạng Thái',
      width: '150px',
      align: 'center',
      render: (e) => <AppBadge tone={examStatusTone[e.status]} className="whitespace-nowrap">{examStatusLabel[e.status]}</AppBadge>,
    },
    {
      header: 'Thao Tác',
      width: '130px',
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
          {getExamCapabilities(e).canEdit && (
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
          {getExamCapabilities(e).canToggleStudentVisibility && (
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
          {getExamCapabilities(e).canDelete && (
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
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Quản Lý Đề Thi & Bài Kiểm Tra"
            description="Tạo và công bố đề thi trắc nghiệm, lập trình, hỗn hợp"
            icon={<ClipboardList size={21} />}
            actions={
              <button
                onClick={() => setIsTypeModalOpen(true)}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-colors flex items-center gap-1.5"
              >
                <Plus size={16} /> Tạo Đề Thi Mới
              </button>
            }
          />

          <TeacherTablePanel>
            <TeacherToolbar
              filters={
                <AppSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  className="w-52"
                  options={[
                    { value: 'ALL', label: 'Trạng thái đề thi' },
                    { value: 'DRAFT', label: 'Bản nháp (DRAFT)' },
                    { value: 'PENDING_APPROVAL', label: 'Chờ duyệt chuyên môn' },
                    { value: 'REJECTED', label: 'Bị từ chối' },
                    { value: 'PUBLISHED', label: 'Công bố (PUBLISHED)' },
                    { value: 'LOCKED', label: 'Đã khóa' },
                    { value: 'ARCHIVED', label: 'Đã lưu trữ' },
                  ]}
                />
              }
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Tìm tên đề thi, môn học..."
              onReset={handleResetFilters}
            />
            <DataTable
              embedded
              columns={columns}
              data={filteredExams}
              keyExtractor={(e) => e.id}
              emptyText="Chưa có đề thi nào được khởi tạo"
              pageSize={10}
              onRowClick={(e) => navigate(`/teacher/exams/${e.id}`)}
            />
          </TeacherTablePanel>
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
