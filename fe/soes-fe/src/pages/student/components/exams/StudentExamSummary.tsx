import { AlertCircle, CalendarClock, CheckCircle2, Timer } from 'lucide-react'
import type { StudentExamStatusCounts } from '../../api/student-portal.api'

const ITEMS = [
  { key: 'OPEN', label: 'Đang mở', icon: Timer, tone: 'text-emerald-600', iconTone: 'bg-emerald-50 text-emerald-600' },
  { key: 'UPCOMING', label: 'Sắp diễn ra', icon: CalendarClock, tone: 'text-blue-600', iconTone: 'bg-blue-50 text-blue-600' },
  { key: 'COMPLETED', label: 'Đã hoàn thành', icon: CheckCircle2, tone: 'text-slate-700', iconTone: 'bg-slate-100 text-slate-600' },
  { key: 'EXPIRED', label: 'Đã quá hạn', icon: AlertCircle, tone: 'text-rose-600', iconTone: 'bg-rose-50 text-rose-600' },
] satisfies Array<{
  key: keyof StudentExamStatusCounts
  label: string
  icon: typeof Timer
  tone: string
  iconTone: string
}>

export default function StudentExamSummary({ counts }: { counts: StudentExamStatusCounts }) {
  return (
    <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Thống kê bài thi">
      {ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <div key={item.key} className="flex min-h-24 items-center gap-4 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${item.iconTone}`}>
              <Icon size={20} />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-bold uppercase text-slate-500">{item.label}</p>
              <p className={`mt-1 text-2xl font-bold ${item.tone}`}>{counts[item.key]}</p>
            </div>
          </div>
        )
      })}
    </section>
  )
}
