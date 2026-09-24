import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { STUDENT_EXAM_WEEKDAYS, type StudentCalendarDay, type StudentExamItem } from './student-exam.types'
import { buildStudentCalendarDays, formatClock, formatDateKey } from './student-exam.utils'

interface StudentExamCalendarProps {
  exams: StudentExamItem[]
  visibleMonth: Date
  selectedDate?: Date | null
  onVisibleMonthChange: (date: Date) => void
  onSelectDay: (date: Date, exams: StudentExamItem[]) => void
}

export default function StudentExamCalendar({
  exams,
  visibleMonth,
  selectedDate,
  onVisibleMonthChange,
  onSelectDay,
}: StudentExamCalendarProps) {
  const calendarDays = useMemo(
    () => buildStudentCalendarDays(visibleMonth, exams),
    [exams, visibleMonth],
  )
  const selectedDateString = selectedDate ? formatDateKey(selectedDate) : null
  const month = visibleMonth.getMonth()
  const year = visibleMonth.getFullYear()
  const examCount = calendarDays
    .filter((day) => day.isCurrentMonth)
    .reduce((total, day) => total + day.exams.length, 0)

  return (
    <div className="overflow-x-auto p-4">
      <div className="min-w-[820px] overflow-hidden rounded-lg border border-slate-200 bg-white">
        <header className="flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 px-5 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => onVisibleMonthChange(new Date())}
              className="h-9 rounded-lg border border-slate-200 px-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Hôm nay
            </button>
            <MonthButton
              label="Tháng trước"
              onClick={() => onVisibleMonthChange(new Date(year, month - 1, 1))}
            >
              <ChevronLeft size={18} />
            </MonthButton>
            <MonthButton
              label="Tháng sau"
              onClick={() => onVisibleMonthChange(new Date(year, month + 1, 1))}
            >
              <ChevronRight size={18} />
            </MonthButton>
            <h2 className="ml-1 text-lg font-bold text-slate-900">
              Tháng {String(month + 1).padStart(2, '0')}, {year}
            </h2>
          </div>

          <span className="inline-flex items-center gap-2 whitespace-nowrap rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            <CalendarDays size={15} />
            {examCount} ca thi trong tháng
          </span>
        </header>

        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 py-3 text-center text-[11px] font-bold text-slate-500">
          {STUDENT_EXAM_WEEKDAYS.map((day) => <div key={day}>{day}</div>)}
        </div>

        <div className="grid grid-cols-7 bg-slate-200/70">
          {calendarDays.map((cell) => (
            <StudentCalendarDayCell
              key={cell.dateString}
              cell={cell}
              isSelected={selectedDateString === cell.dateString}
              onSelectDay={onSelectDay}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function StudentCalendarDayCell({
  cell,
  isSelected,
  onSelectDay,
}: {
  cell: StudentCalendarDay
  isSelected: boolean
  onSelectDay: (date: Date, exams: StudentExamItem[]) => void
}) {
  const visibleExams = cell.exams.slice(0, 2)
  const remainingCount = cell.exams.length - visibleExams.length

  return (
    <button
      type="button"
      onClick={() => onSelectDay(cell.date, cell.exams)}
      className={`m-px flex h-[124px] min-w-0 flex-col p-2.5 text-left transition-colors focus:z-10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-600 ${
        isSelected
          ? 'z-10 bg-blue-50 ring-2 ring-inset ring-blue-600'
          : cell.isCurrentMonth
            ? 'bg-white hover:bg-blue-50/50'
            : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
      }`}
      aria-label={`${cell.dayNumber}, ${cell.exams.length} ca thi`}
    >
      <div className="flex w-full items-center justify-between gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
          cell.isToday
            ? 'bg-blue-600 text-white'
            : isSelected
              ? 'bg-blue-700 text-white'
              : cell.isCurrentMonth ? 'text-slate-800' : 'text-slate-400'
        }`}>
          {cell.dayNumber}
        </span>
        {cell.exams.length > 0 && (
          <span className="whitespace-nowrap rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-600">
            {cell.exams.length} ca
          </span>
        )}
      </div>

      <div className="mt-2 flex min-w-0 flex-1 flex-col gap-1">
        {visibleExams.map((exam) => (
          <ExamMarker key={`${exam.courseOfferingId}-${exam.id}`} exam={exam} />
        ))}
        {remainingCount > 0 && (
          <span className="truncate pl-1 text-[10px] font-bold text-blue-600">
            +{remainingCount} ca thi khác
          </span>
        )}
      </div>
    </button>
  )
}

function ExamMarker({ exam }: { exam: StudentExamItem }) {
  const tone = exam.status === 'OPEN'
    ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
    : exam.status === 'UPCOMING'
      ? 'border-blue-300 bg-blue-50 text-blue-700'
      : 'border-slate-200 bg-slate-50 text-slate-500'

  return (
    <span className={`flex min-w-0 items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-semibold ${tone}`}>
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${exam.status === 'OPEN' ? 'bg-emerald-500' : exam.status === 'UPCOMING' ? 'bg-blue-500' : 'bg-slate-400'}`} />
      <span className="truncate">{formatClock(exam.startTime)} · {exam.courseCode}</span>
    </span>
  )
}

function MonthButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
    >
      {children}
    </button>
  )
}
