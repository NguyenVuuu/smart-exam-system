import { CalendarClock, Eye, ShieldCheck } from 'lucide-react'
import type { ProctorAssignmentApiDto } from '../../types/teacher-course-api.types'

interface ProctorAssignmentActionProps {
  assignment: ProctorAssignmentApiDto
  variant: 'icon' | 'label'
  onOpen: (assignment: ProctorAssignmentApiDto) => void
}

export default function ProctorAssignmentAction({
  assignment,
  variant,
  onOpen,
}: ProctorAssignmentActionProps) {
  if (assignment.status === 'CANCELLED') return <span className="px-3 text-xs text-slate-400">-</span>

  const isOpen = assignment.status === 'OPEN'
  const isScheduled = assignment.status === 'SCHEDULED'
  const label = isOpen ? 'Mở giám sát' : isScheduled ? 'Chưa bắt đầu' : 'Xem nhật ký'
  const icon = isOpen ? <ShieldCheck size={17} /> : isScheduled ? <CalendarClock size={17} /> : <Eye size={17} />

  return (
    <button
      type="button"
      onClick={() => onOpen(assignment)}
      disabled={isScheduled}
      title={label}
      aria-label={label}
      className={variant === 'icon'
        ? 'inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent'
        : 'inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500'}
    >
      {icon}
      {variant === 'label' && label}
    </button>
  )
}
