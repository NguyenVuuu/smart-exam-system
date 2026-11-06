import { CalendarClock, Plus } from 'lucide-react'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuthStore } from '../../store/authStore'
import type { AdminExam, AdminExamSchedule } from './types/admin.types'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import ApprovedExamsList from './components/exam-schedules/ApprovedExamsList'
import CancelExamScheduleDialog from './components/exam-schedules/CancelExamScheduleDialog'
import FinalExamScheduleModal from './components/exam-schedules/FinalExamScheduleModal'
import ScheduledExamsPanel, { type ScheduleFilters } from './components/exam-schedules/ScheduledExamsPanel'
import { useAdminExamSchedules } from './hooks/useAdminExamSchedules'

const emptyFilters: ScheduleFilters = { keyword: '', departmentId: '', subjectId: '', status: '' }

export default function AdminExamSchedulesPage() {
  const canManage = useAuthStore((state) => state.user?.permissions?.includes('SCHEDULES_MANAGE') ?? false)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'schedules' | 'approved'>(
    searchParams.get('tab') === 'approved' ? 'approved' : 'schedules',
  )
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState<ScheduleFilters>(emptyFilters)
  const [modalOpen, setModalOpen] = useState(false)
  const [initialExamId, setInitialExamId] = useState<string | null>(null)
  const [editingSchedule, setEditingSchedule] = useState<AdminExamSchedule | null>(null)
  const [cancellingSchedule, setCancellingSchedule] = useState<AdminExamSchedule | null>(null)
  const {
    schedules, exams, departments, subjects, courses, teachers,
    pagination, loading, error, save, cancel, retry,
  } = useAdminExamSchedules({
    page, pageSize: 5, keyword: filters.keyword || undefined,
    departmentId: filters.departmentId || undefined,
    subjectId: filters.subjectId || undefined, status: filters.status || undefined,
  })
  const requestedExamId = searchParams.get('createExamId')
  const requestedExam = exams.find((exam) => exam.id === requestedExamId)

  const openCreate = (exam?: AdminExam) => {
    setActiveTab('schedules')
    setEditingSchedule(null)
    setInitialExamId(exam?.id ?? null)
    setModalOpen(true)
  }
  const openEdit = (schedule: AdminExamSchedule) => {
    setInitialExamId(null)
    setEditingSchedule(schedule)
    setModalOpen(true)
  }
  const closeModal = () => {
    setModalOpen(false)
    setEditingSchedule(null)
    setInitialExamId(null)
    if (requestedExamId) setSearchParams({ tab: 'schedules' }, { replace: true })
  }

  return <AdminLayout>
    <AdminPageHeader icon={<CalendarClock size={20} />} title="Lịch thi và Phân công"
      description="Tạo ca thi tập trung từ đề cuối kỳ đã duyệt, gán lớp và phân công giảng viên coi thi."
      action={canManage ? <AdminButton icon={<Plus size={17} />} onClick={() => openCreate()}>Tạo lịch thi tập trung</AdminButton> : undefined} />

    <div className="mb-5 flex w-full max-w-[410px] gap-1 rounded-full border border-slate-100 bg-white p-1 shadow-sm" role="tablist" aria-label="Lịch thi và đề đã duyệt">
      <TabButton active={activeTab === 'schedules'} onClick={() => setActiveTab('schedules')}
        label="Các ca thi tập trung" />
      <TabButton active={activeTab === 'approved'} onClick={() => setActiveTab('approved')}
        label="Đề đã duyệt" />
    </div>

    {requestedExamId && !loading && !error && !requestedExam && (
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
        Đề đã chọn chưa sẵn sàng để lập ca thi tập trung.
        <button type="button" className="ml-3 font-semibold underline"
          onClick={() => setSearchParams({ tab: 'schedules' }, { replace: true })}>Đóng</button>
      </div>
    )}

    {activeTab === 'schedules'
      ? <ScheduledExamsPanel items={schedules} departments={departments} subjects={subjects}
          pagination={pagination} loading={loading} error={error} canManage={canManage}
          filters={filters} onFiltersChange={(patch) => { setFilters((current) => ({ ...current, ...patch })); setPage(1) }}
          onReset={() => { setFilters(emptyFilters); setPage(1) }} onRetry={retry} onPageChange={setPage}
          onEdit={openEdit} onCancel={setCancellingSchedule} />
      : loading ? <LoadingPanel message="Đang tải đề đã duyệt..." />
      : error ? <LoadingPanel message={error} onRetry={retry} />
      : <ApprovedExamsList exams={exams} departments={departments} subjects={subjects}
          canManage={canManage} onCreate={openCreate} />}

    {canManage && <FinalExamScheduleModal open={modalOpen || Boolean(requestedExam)}
      exams={exams} schedules={schedules} departments={departments} subjects={subjects}
      courses={courses} users={teachers} initialExamId={initialExamId ?? requestedExam?.id}
      editingSchedule={editingSchedule} onClose={closeModal} onSubmit={save} />}
    {canManage && <CancelExamScheduleDialog key={cancellingSchedule?.id ?? 'closed-cancel-dialog'}
      schedule={cancellingSchedule} onClose={() => setCancellingSchedule(null)}
      onConfirm={async (reason) => {
        if (!cancellingSchedule) return
        try {
          await cancel(cancellingSchedule.id, reason)
          toast.success('Đã hủy ' + cancellingSchedule.examTitle + '.')
          setCancellingSchedule(null)
        } catch {
          toast.error('Không thể hủy ca thi ở trạng thái hiện tại.')
        }
      }} />}
  </AdminLayout>
}

function TabButton({ active, onClick, label }: {
  active: boolean; onClick: () => void; label: string
}) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick}
    className={'min-h-10 min-w-0 flex-1 rounded-full px-3 text-xs font-semibold transition-colors sm:text-sm ' +
      (active ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50')}>
    {label}
  </button>
}

function LoadingPanel({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center text-sm text-slate-500">
    <p>{message}</p>
    {onRetry && <button type="button" className="mt-3 text-emerald-700 underline" onClick={onRetry}>Thử lại</button>}
  </div>
}
