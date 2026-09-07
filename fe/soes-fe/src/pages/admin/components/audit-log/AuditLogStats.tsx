import { Activity, CalendarClock, ListFilter, Users } from 'lucide-react'
import type { AdminAuditLogOverviewApiDto } from '../../types/admin-api.types'

const numberFormatter = new Intl.NumberFormat('vi-VN')

export default function AuditLogStats({ overview, loading }: { overview?: AdminAuditLogOverviewApiDto; loading: boolean }) {
  const stats = [
    { label: 'Tổng bản ghi', count: overview?.totalLogs, icon: Activity, tone: 'bg-blue-50 text-blue-600' },
    { label: 'Phát sinh hôm nay', count: overview?.todayLogs, icon: CalendarClock, tone: 'bg-emerald-50 text-emerald-600' },
    { label: 'Người thực hiện', count: overview?.actorCount, icon: Users, tone: 'bg-amber-50 text-amber-600' },
    { label: 'Loại hành động', count: overview?.actionCount, icon: ListFilter, tone: 'bg-rose-50 text-rose-600' },
  ]

  return (
    <div className="mb-5 grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map(({ label, count, icon: Icon, tone }) => (
        <div key={label} className="flex min-h-24 items-center gap-4 rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon size={19} /></div>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-slate-500">{label}</p>
            <p className={`mt-1 text-xl font-semibold text-slate-950 ${loading ? 'animate-pulse text-slate-300' : ''}`}>
              {loading ? '...' : numberFormatter.format(count ?? 0)}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
