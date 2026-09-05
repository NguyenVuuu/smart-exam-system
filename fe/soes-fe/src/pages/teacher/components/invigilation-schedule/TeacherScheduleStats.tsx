import { CalendarCheck, Clock, ShieldAlert, CheckCircle2 } from 'lucide-react'
import type { ProctorAssignmentApiDto } from '../../types/teacher-course-api.types'

interface TeacherScheduleStatsProps {
  assignments: ProctorAssignmentApiDto[]
}

export default function TeacherScheduleStats({ assignments }: TeacherScheduleStatsProps) {
  const total = assignments.length
  const openCount = assignments.filter((a) => a.status === 'OPEN').length
  const scheduledCount = assignments.filter((a) => a.status === 'SCHEDULED').length
  const closedCount = assignments.filter((a) => a.status === 'CLOSED').length

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 mb-4">
      {/* 1. Tổng ca coi thi: Tím / Violet (Nổi bật, phân biệt rõ ràng) */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-700 shadow-2xs">
          <CalendarCheck size={20} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Tổng ca coi thi</p>
          <p className="text-lg font-bold text-slate-900">{total}</p>
        </div>
      </div>

      {/* 2. Đang diễn ra: Xanh lá / Emerald */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shadow-2xs">
          {openCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
            </span>
          )}
          <ShieldAlert size={20} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Đang diễn ra</p>
          <p className="text-lg font-bold text-emerald-600">{openCount}</p>
        </div>
      </div>

      {/* 3. Sắp diễn ra: Xanh dương / Sky */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700 shadow-2xs">
          <Clock size={20} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Sắp diễn ra</p>
          <p className="text-lg font-bold text-sky-600">{scheduledCount}</p>
        </div>
      </div>

      {/* 4. Đã kết thúc: Xám / Slate */}
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-3.5 shadow-sm">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 shadow-2xs">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <p className="text-xs font-medium text-slate-500">Đã kết thúc</p>
          <p className="text-lg font-bold text-slate-700">{closedCount}</p>
        </div>
      </div>
    </div>
  )
}
