import { CalendarCheck2, ClipboardCheck, Gauge, ShieldAlert } from 'lucide-react'
import type { ComponentType } from 'react'
import type { AdminReportsDto } from '../../api/admin-monitoring.api'

interface ReportKpiGridProps {
  kpis: AdminReportsDto['kpis']
  loading: boolean
}

const numberFormatter = new Intl.NumberFormat('vi-VN')

export default function ReportKpiGrid({ kpis, loading }: ReportKpiGridProps) {
  const cards = [
    { label: 'Ca thi đã kết thúc', value: numberFormatter.format(kpis.schedules), icon: CalendarCheck2, tone: 'blue' },
    { label: 'Tỷ lệ hoàn thành', value: `${kpis.submissionRate}%`, icon: ClipboardCheck, tone: 'emerald' },
    { label: 'Điểm trung bình', value: numberFormatter.format(kpis.averageScore), icon: Gauge, tone: 'amber' },
    { label: 'Cảnh báo vi phạm', value: numberFormatter.format(kpis.violations), icon: ShieldAlert, tone: 'rose' },
  ] as const

  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {cards.map((card) => <ReportKpiCard key={card.label} {...card} loading={loading} />)}
    </div>
  )
}

interface ReportKpiCardProps {
  label: string
  value: string
  icon: ComponentType<{ size?: number }>
  tone: 'blue' | 'emerald' | 'amber' | 'rose'
  loading: boolean
}

function ReportKpiCard({ label, value, icon: Icon, tone, loading }: ReportKpiCardProps) {
  const toneClassName = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    rose: 'bg-rose-50 text-rose-600',
  }[tone]

  return (
    <section className="flex min-h-24 items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${toneClassName}`}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-slate-500">{label}</p>
        <p className={`mt-1 text-xl font-semibold text-slate-950 ${loading ? 'animate-pulse text-slate-300' : ''}`}>
          {loading ? '...' : value}
        </p>
      </div>
    </section>
  )
}
