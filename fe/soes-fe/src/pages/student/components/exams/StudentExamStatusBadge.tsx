import { AlertCircle, CalendarClock, CheckCircle2, Timer } from 'lucide-react'
import type { StudentExamItem } from './student-exam.types'

const STATUS_META = {
  OPEN: {
    label: 'Đang mở',
    className: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    icon: Timer,
  },
  UPCOMING: {
    label: 'Sắp diễn ra',
    className: 'bg-blue-50 text-blue-700 ring-blue-200',
    icon: CalendarClock,
  },
  COMPLETED: {
    label: 'Đã hoàn thành',
    className: 'bg-slate-100 text-slate-600 ring-slate-200',
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Đã quá hạn',
    className: 'bg-rose-50 text-rose-700 ring-rose-200',
    icon: AlertCircle,
  },
} satisfies Record<StudentExamItem['status'], {
  label: string
  className: string
  icon: typeof Timer
}>

export default function StudentExamStatusBadge({ status }: { status: StudentExamItem['status'] }) {
  const meta = STATUS_META[status]
  const Icon = meta.icon

  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold ring-1 ${meta.className}`}>
      <Icon size={14} />
      {meta.label}
    </span>
  )
}
