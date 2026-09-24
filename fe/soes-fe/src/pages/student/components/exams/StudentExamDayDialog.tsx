import { Eye, Play, X } from 'lucide-react'
import { useEffect } from 'react'
import StudentExamStatusBadge from './StudentExamStatusBadge'
import type { StudentExamItem } from './student-exam.types'
import { formatFullDate, formatTimeRange, getStudentExamAction } from './student-exam.utils'

interface StudentExamDayDialogProps {
  date: Date | null
  exams: StudentExamItem[]
  onClose: () => void
  onOpenExam: (exam: StudentExamItem) => void
}

export default function StudentExamDayDialog({
  date,
  exams,
  onClose,
  onOpenExam,
}: StudentExamDayDialogProps) {
  useEffect(() => {
    if (!date) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [date, onClose])

  if (!date) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 px-4 py-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-exam-day-title"
        className="w-full max-w-2xl overflow-hidden rounded-lg bg-white shadow-xl"
      >
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h3 id="student-exam-day-title" className="text-base font-bold text-slate-900">
              {formatFullDate(date)}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{exams.length} ca thi</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Đóng"
          >
            <X size={18} />
          </button>
        </header>

        <div className="max-h-[65vh] space-y-3 overflow-y-auto p-5">
          {exams.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
              Không có ca thi trong ngày này.
            </p>
          ) : exams.map((exam) => (
            <DayExamItem key={`${exam.courseOfferingId}-${exam.id}`} exam={exam} onOpenExam={onOpenExam} />
          ))}
        </div>
      </section>
    </div>
  )
}

function DayExamItem({ exam, onOpenExam }: { exam: StudentExamItem; onOpenExam: (exam: StudentExamItem) => void }) {
  const action = getStudentExamAction(exam)

  return (
    <article className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="font-bold text-slate-900">{exam.title}</p>
          <p className="mt-1 text-sm text-slate-500">{exam.courseCode} · {exam.subjectName}</p>
          <p className="mt-1 text-sm font-medium text-slate-700">
            {formatTimeRange(exam.startTime, exam.endTime)} · {exam.durationMinutes} phút
          </p>
        </div>
        <StudentExamStatusBadge status={exam.status} />
      </div>
      <button
        type="button"
        onClick={() => onOpenExam(exam)}
        className={`mt-4 inline-flex h-9 items-center gap-2 rounded-lg px-3 text-xs font-semibold ${
          action.primary
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
        }`}
      >
        {action.primary ? <Play size={14} /> : <Eye size={14} />}
        {action.label}
      </button>
    </article>
  )
}
