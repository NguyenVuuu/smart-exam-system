import type { ReactNode } from 'react'
import {
  CalendarClock,
  CalendarDays,
  Edit,
  KeyRound,
  MonitorCheck,
  Plus,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { ADMIN_EXAM_SCHEDULES, ADMIN_EXAMS } from './mock/admin.mock'
import type { AdminExamSchedule } from './types/admin.types'
import { AdminStatusBadge, ExamStatusBadge } from './components/AdminBadges'
import AdminButton from './components/AdminButton'
import AdminLayout from './components/AdminLayout'
import AdminPageHeader from './components/AdminPageHeader'
import FinalExamScheduleModal from './components/exam-schedules/FinalExamScheduleModal'

const editableScheduleStatuses: AdminExamSchedule['status'][] = ['DRAFT', 'SCHEDULED']

export default function AdminExamSchedulesPage() {
  const [items, setItems] = useState<AdminExamSchedule[]>(ADMIN_EXAM_SCHEDULES)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingSchedule, setEditingSchedule] = useState<AdminExamSchedule | null>(null)

  const readyFinalExams = ADMIN_EXAMS.filter((exam) => exam.category === 'FINAL' && exam.status === 'APPROVED')

  const handleCancelSchedule = (item: AdminExamSchedule) => {
    setItems((prev) => prev.map((row) => row.id === item.id ? { ...row, status: 'CANCELLED' } : row))
    toast.success(`Đã hủy ${item.examTitle}.`)
  }

  const openCreateModal = () => {
    setEditingSchedule(null)
    setModalOpen(true)
  }

  const openEditModal = (item: AdminExamSchedule) => {
    setEditingSchedule(item)
    setModalOpen(true)
  }

  const handleSubmitSchedule = (schedule: AdminExamSchedule) => {
    setItems((current) => {
      const exists = current.some((item) => item.id === schedule.id)
      return exists
        ? current.map((item) => item.id === schedule.id ? schedule : item)
        : [schedule, ...current]
    })
  }

  const closeScheduleModal = () => {
    setModalOpen(false)
    setEditingSchedule(null)
  }

  return (
    <AdminLayout>
      <AdminPageHeader
        icon={<CalendarClock size={20} />}
        title="Lịch thi và Phân công"
        description="Tạo ca thi tập trung từ đề cuối kỳ đã được duyệt, gán lớp, hình thức/IP và phân công giảng viên coi thi."
        action={<AdminButton icon={<Plus size={17} />} onClick={openCreateModal}>Tạo lịch thi</AdminButton>}
      />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_420px] 2xl:grid-cols-[minmax(0,1fr)_500px]">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-sm font-semibold text-slate-950">Các ca thi tập trung</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Danh sách lịch thi cuối kỳ đang được tổ chức.
            </p>
          </div>

          <div>
            {items.length > 0 ? (
              items.map((item) => (
                <ScheduleListItem
                  key={item.id}
                  item={item}
                  onEdit={() => openEditModal(item)}
                  onCancel={() => handleCancelSchedule(item)}
                />
              ))
            ) : (
              <div className="px-6 py-10 text-center text-sm text-slate-500">Chưa có lịch thi tập trung.</div>
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-6 py-5">
            <h2 className="text-sm font-semibold text-slate-950">Đề đã duyệt sẵn sàng</h2>
            <p className="mt-1 text-[13px] leading-[19px] text-slate-500">
              Chỉ đề được Trưởng bộ môn duyệt.
            </p>
          </div>

          <div className="space-y-4 px-6 py-5">
            {readyFinalExams.map((exam) => (
              <div key={exam.id} className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">{exam.title}</p>
                  <p className="mt-1 text-xs text-slate-400">{exam.subjectName} • {exam.totalPoints} điểm</p>
                </div>
                <ExamStatusBadge status={exam.status} />
              </div>
            ))}
          </div>
        </section>
      </div>

      <FinalExamScheduleModal
        open={modalOpen}
        exams={readyFinalExams}
        schedules={items}
        editingSchedule={editingSchedule}
        onClose={closeScheduleModal}
        onSubmit={handleSubmitSchedule}
      />
    </AdminLayout>
  )
}

function ScheduleListItem({
  item,
  onEdit,
  onCancel,
}: {
  item: AdminExamSchedule
  onEdit: () => void
  onCancel: () => void
}) {
  const canEdit = editableScheduleStatuses.includes(item.status)

  return (
    <div className="border-b border-gray-100 px-6 py-5 last:border-b-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <AdminStatusBadge status={item.status} />
            <p className="min-w-0 text-sm font-semibold text-slate-950">{item.examTitle}</p>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-600">
            <ScheduleMeta icon={<CalendarDays size={17} />} text={`${item.date} • ${item.time}`} />
            <ScheduleMeta icon={<Users size={17} />} text={item.courseCodes.join(', ')} />
            <ScheduleMeta icon={<MonitorCheck size={17} />} text={item.location} />
            <ScheduleMeta icon={<KeyRound size={17} />} text={item.password ? 'Có mật khẩu' : 'Không mật khẩu'} />
            <ScheduleMeta
              icon={<ShieldCheck size={17} />}
              text={formatProctorAssignments(item)}
            />
          </div>

          <p className="mt-2 text-[13px] leading-[19px] text-slate-400">
            {item.subjectName} • {item.distributionMode} • {item.releaseMode}
          </p>
        </div>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              title="Sửa ca thi"
              aria-label="Sửa ca thi"
              onClick={onEdit}
            >
              <Edit size={15} />
            </button>
            <button
              type="button"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white transition-colors hover:bg-rose-700"
              title="Hủy ca thi"
              aria-label="Hủy ca thi"
              onClick={onCancel}
            >
              <Trash2 size={15} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2" title={text}>
      <span className="shrink-0 text-slate-400">{icon}</span>
      <span className="truncate">{text}</span>
    </span>
  )
}

function formatProctorAssignments(item: AdminExamSchedule) {
  if (!item.proctorAssignments?.length) return item.proctors.join(', ')

  const grouped = item.proctorAssignments.reduce<Record<string, string[]>>((result, assignment) => {
    const current = result[assignment.courseCode] ?? []
    if (!current.includes(assignment.teacherName)) current.push(assignment.teacherName)
    result[assignment.courseCode] = current
    return result
  }, {})

  return Object.entries(grouped)
    .map(([courseCode, teacherNames]) => `${courseCode}: ${teacherNames.join(', ')}`)
    .join(' · ')
}
