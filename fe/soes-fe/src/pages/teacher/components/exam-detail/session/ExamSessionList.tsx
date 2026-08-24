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
      <div className="rounded-xl border border-dashed border-gray-200 p-8 text-center text-xs text-gray-500">
        {emptyText}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 items-stretch">
      {sessions.map((session) => {
        const canChange = session.status === 'DRAFT' || session.status === 'SCHEDULED'
        const showManagementActions = variant === 'manage' && canChange && (onEdit || onRemove)

        return (
          <AppCard key={session.id} className="relative p-3.5 min-h-[176px] flex flex-col gap-2.5">
            <div className={`flex items-start justify-between gap-3 ${variant === 'draft' ? 'pr-14' : ''}`}>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate">{session.courseCode}</p>
                <p className="text-xs text-gray-500 truncate">{session.subjectName}</p>
                <p className="text-xs text-blue-700 font-medium mt-0.5">
                  {session.startTime.replace('T', ' ')} - {session.endTime.replace('T', ' ')}
                </p>
              </div>
              <StatusBadge status={session.status} />
            </div>

            {variant === 'draft' && canChange && (onEdit || onRemove) && (
              <div className="absolute right-2.5 top-2.5 flex items-center gap-1">
                {canChange && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(session)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                    title="Sửa ca thi"
                  >
                    <Edit3 size={14} />
                  </button>
                )}
                {canChange && onRemove && (
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

            <div className="flex flex-wrap gap-2 text-xs">
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
              <div className="mt-auto flex items-center justify-end gap-2 pt-2.5 border-t border-gray-100">
                {session.status === 'OPEN' && (
                  <button
                    type="button"
                    onClick={() => navigate('/teacher/proctoring')}
                    className="px-3 py-1.5 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-xs rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-2xs"
                  >
                    <MonitorCheck size={14} className="text-emerald-600" /> Giám sát
                  </button>
                )}
                {onView && (
                  <button
                    type="button"
                    onClick={() => onView(session)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Eye size={13} /> Xem chi tiết
                  </button>
                )}
                {showManagementActions && onEdit && (
                  <button
                    type="button"
                    onClick={() => onEdit(session)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <Edit3 size={13} /> Cập nhật
                  </button>
                )}
                {showManagementActions && onRemove && (
                  <button
                    type="button"
                    onClick={() => onRemove(session.id)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-rose-50 text-gray-500 hover:text-rose-600 text-xs font-semibold rounded-lg transition-colors inline-flex items-center gap-1.5"
                  >
                    <X size={13} /> Hủy ca
                  </button>
                )}
              </div>
            )}
          </AppCard>
        )
      })}
    </div>
  )
}

function RuleBadge({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-100 px-2 py-1 text-blue-700">
      {icon}
      {label}
    </span>
  )
}

function StatusBadge({ status }: { status: ExamSchedule['status'] }) {
  const label = {
    DRAFT: 'Bản nháp',
    SCHEDULED: 'Đã lên lịch',
    OPEN: 'Đang mở',
    CLOSED: 'Đã đóng',
    CANCELLED: 'Đã hủy',
  }[status]
  const className =
    status === 'OPEN'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold'
      : status === 'CLOSED'
      ? 'bg-gray-100 text-gray-600 border-gray-200'
      : status === 'SCHEDULED'
      ? 'bg-blue-50 text-blue-700 border-blue-200'
      : 'bg-amber-50 text-amber-700 border-amber-200'

  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-xs font-semibold shrink-0 ${className}`}>
      {label}
    </span>
  )
}

function securitySummary(session: ExamSchedule) {
  const enabled = [
    session.requireFullscreen,
    session.enableWebcam,
    session.blockCopyPaste,
    session.blockRightClick,
  ].filter(Boolean).length

  return `${enabled} quy định`
}
