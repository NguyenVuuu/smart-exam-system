import { ClipboardList, Copy, Edit, Eye, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import CreateExamTypeModal from './components/exam-detail/CreateExamTypeModal'
import DeleteExamDialog from './components/exam-detail/DeleteExamDialog'
import { useTeacherExams } from './hooks/useTeacherExams'
import type { Exam } from './types/teacher-exam.types'
import { examStatusLabel, examStatusTone } from './constants/examStatus'
import { useTeacherCourses } from './hooks/useTeacherCourses'

export default function TeacherExamsPage() {
  const navigate = useNavigate()
  const examApi = useTeacherExams()
  const { exams } = examApi
  const { semesterOptions, currentSemesterId } = useTeacherCourses()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('ALL')
  const [selectedSemester, setSelectedSemester] = useState<string | null>(null)
  const [isTypeModalOpen, setIsTypeModalOpen] = useState(false)
  const [deletingExam, setDeletingExam] = useState<Exam | null>(null)

  const effectiveSemester = selectedSemester ?? currentSemesterId ?? 'ALL'

  const handleResetFilters = () => {
    setSearchQuery('')
    setSelectedStatus('ALL')
    setSelectedSemester(currentSemesterId ?? 'ALL')
  }

  const filteredExams = exams.filter((e) => {
    const matchesStatus = selectedStatus === 'ALL' || e.status === selectedStatus
    const matchesSemester = effectiveSemester === 'ALL' || e.semesterId === effectiveSemester
    const matchesSearch =
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subjectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.subjectName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSemester && matchesSearch
  })

  const handleDeleteExam = (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    setDeletingExam(exam)
  }

  const handleCopyExam = async (exam: Exam, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const copied = await examApi.copy(exam.id)
      toast.success('Đã sao chép đề thành bản nháp mới.')
      navigate(`/teacher/exams/${copied.id}/edit`)
    } catch { toast.error('Không thể sao chép đề thi.') }
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
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {e.subjectName} · {e.semesterName}
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
        <span className="text-gray-700 text-sm">{e.questionCount ?? e.questions?.length ?? 0} câu</span>
      ),
    },
    {
      header: 'Thời Gian',
      width: '150px',
      render: (e) => (
        <span className="whitespace-nowrap text-sm text-gray-800">
          {e.defaultDurationMinutes} phút - {e.scheduleCount ?? e.schedules?.length ?? 0} ca thi
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
          {e.capabilities?.canEdit && (
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
          {e.capabilities?.canCopy && <button
            onClick={(ev) => void handleCopyExam(e, ev)}
            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="Sao chép đề thành bản nháp mới"
          >
            <Copy size={16} />
          </button>}
          {e.capabilities?.canDelete && (
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
              filters={<>
                <AppSelect
                  value={effectiveSemester}
                  onChange={setSelectedSemester}
                  className="w-72"
                  options={[{ value: 'ALL', label: 'Tất cả học kỳ' }, ...semesterOptions]}
                />
                <AppSelect
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                  className="w-52"
                  options={[
                    { value: 'ALL', label: 'Trạng thái đề thi' },
                    { value: 'DRAFT', label: 'Bản nháp (DRAFT)' },
                    { value: 'PENDING_APPROVAL', label: 'Chờ duyệt chuyên môn' },
                    { value: 'REJECTED', label: 'Bị từ chối' },
                    { value: 'PUBLISHED', label: 'Đã công bố' },
                    { value: 'LOCKED', label: 'Đã khóa' },
                    { value: 'ARCHIVED', label: 'Đã lưu trữ' },
                  ]}
                />
              </>}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Tìm tên đề thi, môn học..."
              onReset={handleResetFilters}
            />
            <DataTable
              embedded
              columns={columns}
              data={examApi.loading ? [] : filteredExams}
              keyExtractor={(e) => e.id}
              emptyText="Chưa có đề thi nào được khởi tạo"
              pageSize={10}
              onRowClick={(e) => navigate(`/teacher/exams/${e.id}`)}
            />
          </TeacherTablePanel>
          {examApi.error && (
            <div className="flex items-center justify-center gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <span>{examApi.error}</span>
              <button type="button" onClick={() => void examApi.retry()} className="font-semibold underline">Thử lại</button>
            </div>
          )}
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
      <DeleteExamDialog
        exam={deletingExam}
        onClose={() => setDeletingExam(null)}
        onConfirm={async () => {
          if (!deletingExam) return
          try {
            await examApi.remove(deletingExam.id)
            setDeletingExam(null)
            toast.success('Đã xóa đề thi nháp.')
          } catch { toast.error('Không thể xóa đề thi ở trạng thái hiện tại.') }
        }}
      />
    </div>
  )
}
