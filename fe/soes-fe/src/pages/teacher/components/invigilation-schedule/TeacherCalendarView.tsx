import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import type {
  ProctorAssignmentApiDto,
} from '../../types/teacher-course-api.types'
import {
  getCalendarDays,
  formatDateToYMD,
  formatTimeRange,
  type CalendarDayCell,
} from '../../utils/scheduleCalendar.utils'

const WEEKDAYS = [
  'Thứ 2',
  'Thứ 3',
  'Thứ 4',
  'Thứ 5',
  'Thứ 6',
  'Thứ 7',
  'Chủ nhật',
]

interface TeacherCalendarViewProps {
  assignments: ProctorAssignmentApiDto[]
  selectedDate?: Date | null
  onSelectDay: (date: Date, assignments: ProctorAssignmentApiDto[]) => void
}

export default function TeacherCalendarView({
  assignments,
  selectedDate,
  onSelectDay,
}: TeacherCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState<Date>(() => selectedDate ?? new Date())

  const calendarDays = useMemo(() => {
    return getCalendarDays(currentDate, assignments)
  }, [currentDate, assignments])

  const selectedDateStr = useMemo(() => {
    return selectedDate ? formatDateToYMD(selectedDate) : null
  }, [selectedDate])

  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()

  const currentMonthTitle = useMemo(() => {
    const m = String(currentMonth + 1).padStart(2, '0')
    return `Tháng ${m}, ${currentYear}`
  }, [currentMonth, currentYear])

  const goToPrevMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const goToNextMonth = () => {
    setCurrentDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  // Count assignments in current viewing month
  const currentMonthAssignmentsCount = useMemo(() => {
    return calendarDays
      .filter((d) => d.isCurrentMonth)
      .reduce((sum, d) => sum + d.assignments.length, 0)
  }, [calendarDays])

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-2xs">
      {/* Sleek, Clean Google-Calendar style Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 px-6 py-4 bg-white">
        {/* Left: Navigation & Current Month Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={goToToday}
              className="h-9 rounded-xl border border-gray-200 bg-white px-3.5 text-sm font-semibold text-slate-700 hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Hôm nay
            </button>
            <div className="flex items-center rounded-xl border border-gray-200 bg-white p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={goToPrevMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-gray-100 transition-colors"
                title="Tháng trước"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={goToNextMonth}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-gray-100 transition-colors"
                title="Tháng sau"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            {currentMonthTitle}
          </h2>
        </div>

        {/* Right: Clean summary badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3.5 py-1.5 text-xs font-semibold text-blue-700">
            <CalendarIcon size={14} />
            <span>Có <strong>{currentMonthAssignmentsCount}</strong> ca thi trong tháng</span>
          </span>
        </div>
      </div>

      {/* Weekday column headers */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-center text-[12px] font-bold text-slate-500 uppercase py-3 tracking-wide">
        {WEEKDAYS.map((day) => (
          <div key={day}>
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-gray-100 bg-gray-100/60">
        {calendarDays.map((cell) => (
          <DayCell
            key={cell.dateString}
            cell={cell}
            isSelected={selectedDateStr === cell.dateString}
            onSelectDay={onSelectDay}
          />
        ))}
      </div>
    </div>
  )
}

function DayCell({
  cell,
  isSelected,
  onSelectDay,
}: {
  cell: CalendarDayCell
  isSelected: boolean
  onSelectDay: (date: Date, assignments: ProctorAssignmentApiDto[]) => void
}) {
  const hasExams = cell.assignments.length > 0
  const maxDisplay = 2
  const visibleAssignments = cell.assignments.slice(0, maxDisplay)
  const remainingCount = cell.assignments.length - maxDisplay

  const hasLive = cell.assignments.some((a) => a.status === 'OPEN')
  const hasScheduled = cell.assignments.some((a) => a.status === 'SCHEDULED')
  const hasUpcoming = hasLive || hasScheduled

  return (
    <div
      onClick={() => onSelectDay(cell.date, cell.assignments)}
      className={`group relative flex min-h-[115px] sm:min-h-[130px] flex-col justify-between p-2.5 transition-all cursor-pointer ${
        isSelected
          ? 'bg-blue-50/90 ring-2 ring-blue-600 ring-inset z-10 shadow-xs'
          : cell.isCurrentMonth
            ? 'bg-white hover:bg-blue-50/40'
            : 'bg-gray-50/70 text-slate-400'
      }`}
    >
      {/* Cell Header: Date Number & Badge Indicator */}
      <div className="flex items-center justify-between">
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
            cell.isToday
              ? 'bg-blue-600 text-white shadow-xs'
              : isSelected
                ? 'bg-blue-700 text-white'
                : cell.isCurrentMonth
                  ? 'text-slate-800'
                  : 'text-slate-400'
          }`}
        >
          {cell.dayNumber}
        </span>

        {hasExams && (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-2xs ${
              hasLive
                ? 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-300'
                : hasScheduled
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            {cell.assignments.length} ca
          </span>
        )}
      </div>

      {/* Event Pills inside Day Cell */}
      <div className="mt-1.5 flex flex-1 flex-col gap-1">
        {visibleAssignments.map((item) => {
          const isLive = item.status === 'OPEN'
          const isScheduled = item.status === 'SCHEDULED'

          return (
            <div
              key={item.id}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-0.5 text-[11px] leading-tight border transition-all truncate shadow-2xs ${
                isLive
                  ? 'border-emerald-400 bg-emerald-50 text-emerald-700 font-bold'
                  : isScheduled
                    ? 'border-sky-400 bg-sky-50 text-sky-700 font-semibold'
                    : 'border-slate-300 bg-slate-50 text-slate-500 font-medium'
              }`}
            >
              {isLive ? (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                </span>
              ) : (
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                    isScheduled ? 'bg-sky-500' : 'bg-slate-400'
                  }`}
                />
              )}
              <span className="truncate">
                {formatTimeRange(item.startTime, item.endTime).split(' - ')[0]} · {item.courseOffering.code}
              </span>
            </div>
          )
        })}

        {remainingCount > 0 && (
          <span
            className={`text-[10px] font-bold pl-1 hover:underline ${
              hasUpcoming ? 'text-blue-600 hover:text-blue-700' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            +{remainingCount} ca thi khác...
          </span>
        )}
      </div>
    </div>
  )
}
