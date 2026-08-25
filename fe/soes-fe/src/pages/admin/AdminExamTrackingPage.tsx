import { CalendarPlus, Eye, FileCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import DataTable, { type ColumnDef } from '../../components/common/DataTable'
import { ADMIN_EXAMS } from './mock/admin.mock'
import type { AdminExam } from './types/admin.types'
import { ExamCategoryBadge, ExamStatusBadge } from './components/AdminBadges'
import AdminLayout from './components/AdminLayout'
import AdminModal from './components/AdminModal'
import AdminPageHeader from './components/AdminPageHeader'
import AdminSelect from './components/AdminSelect'
import AdminTablePanel from './components/AdminTablePanel'
import AdminToolbar from './components/AdminToolbar'

export default function AdminExamTrackingPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<'ALL' | AdminExam['category']>('ALL')
  const [status, setStatus] = useState<'ALL' | AdminExam['status']>('ALL')
  const [search, setSearch] = useState('')
  const [viewing, setViewing] = useState<AdminExam | null>(null)

  const filteredExams = useMemo(() => ADMIN_EXAMS.filter((item) => {
    const matchesCategory = category === 'ALL' || item.category === category
    const matchesStatus = status === 'ALL' || item.status === status
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.subjectName.toLowerCase().includes(search.toLowerCase()) ||
      item.authorName.toLowerCase().includes(search.toLowerCase())
    return matchesCategory && matchesStatus && matchesSearch
  }), [category, search, status])

  const columns: ColumnDef<AdminExam>[] = [
    {
      header: 'ĐỀ THI',
      render: (item) => (
        <div className="space-y-1">
          <p className="text-sm font-semibold text-slate-950">{item.title}</p>
          <p className="text-xs text-slate-400">{item.subjectName} • Giảng viên soạn: {item.authorName}</p>
        </div>
      ),
    },
    {
      header: 'LOẠI',
      width: '170px',
      render: (item) => (
        <div className="space-y-1">
          <ExamCategoryBadge category={item.category} />
          <p className="text-xs text-slate-400">{item.structure === 'MIXED' ? 'Hỗn hợp' : item.structure === 'PROGRAMMING' ? 'Lập trình' : 'Trắc nghiệm'}</p>
        </div>
      ),
    },
    { header: 'ĐIỂM / CÂU', width: '150px', render: (item) => <span className="text-sm text-slate-700">{item.totalPoints} điểm • {item.questionCount} câu</span> },
    { header: 'THỜI GIAN', width: '120px', render: (item) => <span className="text-sm text-slate-700">{item.durationMinutes} phút</span> },
    { header: 'TRẠNG THÁI', width: '180px', render: (item) => <ExamStatusBadge status={item.status} /> },
    {
      header: 'THAO TÁC',
      width: '130px',
      align: 'right',
      render: (item) => (
        <div className="flex justify-end gap-1 text-slate-500">
          <button className="rounded-lg p-1.5 hover:bg-blue-50 hover:text-blue-600" title="Xem đề" onClick={() => setViewing(item)}><Eye size={17} /></button>
          <button
            disabled={item.status !== 'APPROVED'}
            className="rounded-lg p-1.5 hover:bg-emerald-50 hover:text-emerald-600 disabled:cursor-not-allowed disabled:opacity-30"
            title={item.status === 'APPROVED' ? 'Tạo lịch thi từ đề này' : 'Chỉ đề đã duyệt mới được tạo lịch thi'}
            onClick={() => navigate('/admin/exam-schedules')}
          >
            <CalendarPlus size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<FileCheck size={20} />}
        title="Theo dõi đề thi và duyệt"
        description="Theo dõi đề thi theo trạng thái. Chỉ đề cuối kỳ đã được Trưởng bộ môn duyệt mới được chọn để tạo lịch thi tập trung."
      />

      <AdminTablePanel>
        <AdminToolbar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Tìm theo tên đề, môn học hoặc giảng viên..."
          onReset={() => {
            setSearch('')
            setCategory('ALL')
            setStatus('ALL')
          }}
          filters={(
            <>
              <AdminSelect value={category} onChange={setCategory} className="w-48" options={[
                { value: 'ALL', label: 'Loại bài thi' },
                { value: 'QUIZ', label: 'Quiz' },
                { value: 'MIDTERM', label: 'Giữa kỳ' },
                { value: 'FINAL', label: 'Cuối kỳ' },
              ]} />
              <AdminSelect value={status} onChange={setStatus} className="w-56" options={[
                { value: 'ALL', label: 'Trạng thái' },
                { value: 'PENDING_APPROVAL', label: 'Chờ Trưởng bộ môn' },
                { value: 'APPROVED', label: 'Đã duyệt' },
                { value: 'DRAFT', label: 'Nháp' },
                { value: 'REJECTED', label: 'Bị từ chối' },
                { value: 'LOCKED', label: 'Đã khóa' },
              ]} />
            </>
          )}
        />
        <DataTable columns={columns} data={filteredExams} keyExtractor={(item) => item.id} emptyText="Chưa có đề thi phù hợp." />
      </AdminTablePanel>

      <AdminModal
        open={Boolean(viewing)}
        title="Xem đề thi"
        description="Admin chỉ theo dõi trạng thái và dùng đề đã duyệt để tạo lịch thi, không sửa nội dung học thuật."
        confirmText="Đóng"
        onClose={() => setViewing(null)}
        onConfirm={() => setViewing(null)}
      >
        {viewing && (
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
              <p className="text-base font-semibold text-slate-950">{viewing.title}</p>
              <p className="mt-1 text-sm text-slate-500">{viewing.subjectName} • {viewing.durationMinutes} phút • {viewing.totalPoints} điểm</p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
              <p>Giảng viên soạn: <span className="font-semibold text-slate-800">{viewing.authorName}</span></p>
              <p>Số câu hỏi: <span className="font-semibold text-slate-800">{viewing.questionCount}</span></p>
              <p>Loại đề: <span className="font-semibold text-slate-800">{viewing.structure}</span></p>
              <p>Trạng thái: <span className="font-semibold text-slate-800">{viewing.status}</span></p>
            </div>
          </div>
        )}
      </AdminModal>
    </AdminLayout>
  )
}
