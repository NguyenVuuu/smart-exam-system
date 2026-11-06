import type { ReactNode } from 'react'
import { CalendarDays, Edit, KeyRound, MonitorCheck, ShieldCheck, Trash2, Users } from 'lucide-react'
import type { AdminExamSchedule } from '../../types/admin.types'
import { AdminStatusBadge } from '../AdminBadges'

const editableStatuses: AdminExamSchedule['status'][] = ['DRAFT', 'SCHEDULED']

export default function ScheduleListItem({ item, canManage, onEdit, onCancel }: {
  item: AdminExamSchedule
  canManage: boolean
  onEdit: () => void
  onCancel: () => void
}) {
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
            <ScheduleMeta icon={<KeyRound size={17} />} text={item.hasPassword || item.password ? 'Có mật khẩu' : 'Không mật khẩu'} />
            <ScheduleMeta icon={<ShieldCheck size={17} />} text={formatProctors(item)} />
          </div>
          <p className="mt-2 text-[13px] leading-[19px] text-slate-400">
            {item.subjectName} • {item.distributionMode} • {item.releaseMode}
          </p>
        </div>
        {canManage && editableStatuses.includes(item.status) && (
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-slate-500 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
              title="Sửa ca thi" aria-label="Sửa ca thi" onClick={onEdit}><Edit size={15} /></button>
            <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-rose-600 text-white transition-colors hover:bg-rose-700"
              title="Hủy ca thi" aria-label="Hủy ca thi" onClick={onCancel}><Trash2 size={15} /></button>
          </div>
        )}
      </div>
    </div>
  )
}

function ScheduleMeta({ icon, text }: { icon: ReactNode; text: string }) {
  return <span className="inline-flex min-w-0 items-center gap-2" title={text}>
    <span className="shrink-0 text-slate-400">{icon}</span><span className="truncate">{text}</span>
  </span>
}

function formatProctors(item: AdminExamSchedule) {
  if (!item.proctorAssignments?.length) return item.proctors.join(', ')
  const grouped = item.proctorAssignments.reduce<Record<string, string[]>>((result, assignment) => {
    const names = result[assignment.courseCode] ?? []
    if (!names.includes(assignment.teacherName)) names.push(assignment.teacherName)
    result[assignment.courseCode] = names
    return result
  }, {})
  return Object.entries(grouped).map(([course, names]) => `${course}: ${names.join(', ')}`).join(' · ')
}
