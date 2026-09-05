import { Clock, Edit3, Eye, EyeOff, Globe, MonitorCheck, X } from 'lucide-react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import AppCard from '../../../../../components/common/AppCard'
import type { ExamSchedule } from '../../../types/teacher-exam.types'
import { formatSessionRange, parseDateTimeParts, formatDate } from '../../../../../utils/date.utils'

function getSessionEffectiveStatus(session: ExamSchedule): ExamSchedule['status'] {
  if (session.status === 'CANCELLED' || session.status === 'DRAFT') {
    return session.status
  }
  const now = Date.now()
  const start = new Date(session.startTime).getTime()
  const end = new Date(session.endTime).getTime()
  if (now < start) return 'SCHEDULED'
  if (now >= start && now < end) return 'OPEN'
  return 'CLOSED'
}

export function ExamSessionList({
  sessions,
  variant = 'manage',
  onView,
  onEdit,
  onRemove,
  emptyText = 'Chưa có ca thi nào được gán.',
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
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {sessions.map((session) => {
        const effectiveStatus = getSessionEffectiveStatus(session)
        const canChange = effectiveStatus === 'DRAFT' || effectiveStatus === 'SCHEDULED'
        const showManagementActions = variant === 'manage' && canChange && (onEdit || onRemove)
        const showDraftActions = variant === 'draft' && canChange && (onEdit || onRemove)

        return (
          <AppCard key={session.id} className="relative flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-4 shadow-xs hover:shadow-sm transition-shadow">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-slate-900">{session.courseCode}</p>
                  <p className="truncate text-xs font-medium text-slate-500 mt-0.5">{session.subjectName}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge status={effectiveStatus} />
                  {showDraftActions && onEdit && (
                    <button
                      type="button"
                      onClick={() => onEdit(session)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                      title="Sửa ca thi"
                    >
                      <Edit3 size={15} />
                    </button>
                  )}
                  {showDraftActions && onRemove && (
                    <button
                      type="button"
                      onClick={() => onRemove(session.id)}
                      className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-rose-50 hover:text-rose-600"
                      title="Xóa ca thi"
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600">
                <Clock size={13} className="shrink-0" />
                <span>{formatSessionTime(session)}</span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <RuleBadge icon={<Clock size={12} />} label={`${session.durationMinutes} phút`} />
                <RuleBadge icon={<MonitorCheck size={12} />} label={securitySummary(session)} />
                <RuleBadge
                  icon={<Globe size={12} />}
                  label={session.ipMode === 'CAMPUS' ? 'IP trường' : 'Thi tại nhà/Online'}
                />
                <RuleBadge
                  icon={session.allowStudentReview ? <Eye size={12} /> : <EyeOff size={12} />}
                  label={session.allowStudentReview ? 'Cho xem lại' : 'Ẩn bài làm'}
                />
              </div>
            </div>

            {variant === 'manage' && (
              <div className="mt-3 flex items-center justify-end gap-1.5 border-t border-gray-100 pt-2.5">
                {session.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/proctoring')}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-emerald-700 shadow-2xs transition-colors hover:bg-emerald-50"
                  >
                    <MonitorCheck size={14} className="text-emerald-600" /> Giám sát
                  </button>
                )}
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(session)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 transition-colors hover:bg-blue-100"
                  >
                    <Eye size={13} /> Chi tiết ca thi
                  </button>
                )}
                {showManagementActions && (
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(session)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Sửa ca thi"
                      >
                        <Edit3 size={15} />
                      </button>
                    )}
                    {onRemove && (
                      <button
                        type="button"
                        onClick={() => onRemove(session.id)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Xóa ca thi"
                      >
                        <X size={15} />
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
    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-md border shrink-0 ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

function RuleBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-gray-200/60 bg-gray-50 px-2 py-1 text-[11px] font-medium text-slate-600">
      {icon}
      <span className="truncate">{label}</span>
    </span>
  )
}

export function formatSessionTime(session: ExamSchedule) {
  return formatSessionRange(session.startTime, session.endTime)
}

export function parseSessionDateTime(value: string) {
  return parseDateTimeParts(value)
}

export function formatDisplayDate(date: string) {
  return formatDate(date)
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
