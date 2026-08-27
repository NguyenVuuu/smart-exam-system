import { Clock, Edit3, Eye, EyeOff, Globe, MonitorCheck, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AppCard from '../../../../../components/common/AppCard'
import type { ExamSchedule } from '../../../types/teacher-exam.types'

export function ExamSessionList({
  sessions,
  variant = 'manage',
  onView,
  onEdit,
  onRemove,
  emptyText = 'Chưa có ca thi nào.',
}: {
  sessions: ExamSchedule[]
  variant?: 'manage' | 'draft'
  onView?: (session: ExamSchedule) => void
  onEdit?: (session: ExamSchedule) => void
  onRemove?: (sessionId: string) => void
  emptyText?: string
}) {
  const navigate = useNavigate()

  if (sessions.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500 bg-white">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 items-stretch">
      {sessions.map((session) => {
        const canChange = session.status === 'DRAFT' || session.status === 'SCHEDULED'
        const showManagementActions = variant === 'manage' && canChange && (onEdit || onRemove)
        const showDraftActions = variant === 'draft' && canChange && (onEdit || onRemove)

        return (
          <AppCard key={session.id} className="relative flex min-h-[178px] flex-col gap-3 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-950">{session.courseCode}</p>
                <p className="mt-0.5 truncate text-[13px] leading-[19px] text-slate-500">{session.subjectName}</p>
                <p className="mt-1 whitespace-normal break-words text-[13px] font-semibold leading-[19px] text-blue-600">
                  {formatSessionTime(session)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge status={session.status} />
                {showDraftActions && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(session)}
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                    title="Sửa ca thi"
                  >
                    <Edit3 size={16} />
                  </button>
                )}
                {showDraftActions && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(session.id)}
                    className="rounded-xl p-2 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                    title="Xóa ca thi"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <RuleBadge icon={<Clock size={13} />} label={`${session.durationMinutes} phút`} />
              <RuleBadge icon={<MonitorCheck size={13} />} label={securitySummary(session)} />
              <RuleBadge
                icon={<Globe size={13} />}
                label={session.ipMode === 'CAMPUS' ? 'Giới hạn IP trường' : 'Thi tại nhà/Online'}
              />
              <RuleBadge
                icon={session.allowStudentReview ? <Eye size={13} /> : <EyeOff size={13} />}
                label={session.allowStudentReview ? 'Cho xem lại' : 'Ẩn bài làm'}
              />
            </div>

            {variant === 'manage' && (
              <div className="mt-auto flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                {session.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/proctoring')}
                    className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <MonitorCheck size={15} className="text-emerald-600" /> Giám sát
                  </button>
                )}
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(session)}
                    className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5"
                  >
                    <Eye size={14} /> Chi tiết ca thi
                  </button>
                )}
                {showManagementActions && (
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(session)}
                        className="p-2 rounded-xl text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Sửa ca thi"
                      >
                        <Edit3 size={15} />
                      </button>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(session.id)}
                        className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa ca thi"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </AppCard>
        )
      })}
    </div>
  )
}

function StatusBadge({ status }: { status: ExamSchedule['status'] }) {
  const styles: Record<ExamSchedule['status'], string> = {
    DRAFT: 'bg-amber-50 text-amber-700 border-amber-200',
    SCHEDULED: 'bg-blue-50 text-blue-700 border-blue-200',
    OPEN: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
    CANCELLED: 'bg-rose-50 text-rose-700 border-rose-200',
  }
  const labels: Record<ExamSchedule['status'], string> = {
    DRAFT: 'Bản nháp',
    SCHEDULED: 'Đã lên lịch',
    OPEN: 'Đang mở thi',
    CLOSED: 'Đã kết thúc',
    CANCELLED: 'Đã hủy',
  }

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg border shrink-0 ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function RuleBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200/60 bg-gray-50 px-2.5 py-1.5 text-xs font-medium text-slate-600">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  )
}

function formatSessionTime(session: ExamSchedule) {
  const { date: startDate, time: startTime } = parseSessionDateTime(session.startTime)
  const { time: endTime } = parseSessionDateTime(session.endTime)
  return `${formatDisplayDate(startDate)} · ${startTime} - ${endTime}`
}

function parseSessionDateTime(value: string) {
  const [date = '', rawTime = ''] = value.includes('T') ? value.split('T') : value.split(' ')
  return {
    date,
    time: rawTime.slice(0, 5),
  }
}

function formatDisplayDate(date: string) {
  const [year, month, day] = date.split('-')
  return year && month && day ? `${day}/${month}/${year}` : date
}

function securitySummary(session: ExamSchedule) {
  const count = [
    session.requireFullscreen,
    session.enableWebcam,
    session.blockCopyPaste,
    session.blockRightClick,
  ].filter(Boolean).length

  return count === 4 ? 'Chống gian lận tối đa' : `${count}/4 lớp bảo vệ`
}
