import type { StudentCalendarDay, StudentExamItem } from './student-exam.types'

export function buildStudentCalendarDays(
  currentMonthDate: Date,
  exams: StudentExamItem[],
): StudentCalendarDay[] {
  const year = currentMonthDate.getFullYear()
  const month = currentMonthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const examsByDate = groupExamsByDate(exams)
  const today = formatDateKey(new Date())
  const days: StudentCalendarDay[] = []

  const mondayBasedStart = (firstDay.getDay() + 6) % 7
  const previousMonthLastDay = new Date(year, month, 0).getDate()

  for (let offset = mondayBasedStart - 1; offset >= 0; offset -= 1) {
    appendDay(days, new Date(year, month - 1, previousMonthLastDay - offset), false, today, examsByDate)
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    appendDay(days, new Date(year, month, day), true, today, examsByDate)
  }

  const targetCellCount = 42
  for (let day = 1; days.length < targetCellCount; day += 1) {
    appendDay(days, new Date(year, month + 1, day), false, today, examsByDate)
  }

  return days
}

export function formatDateKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatClock(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

export function formatTimeRange(startTime: string, endTime: string) {
  return `${formatClock(startTime)} - ${formatClock(endTime)}`
}

export function formatFullDate(date: Date) {
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

export function formatExamTime(exam: StudentExamItem) {
  const start = new Date(exam.startTime)
  const end = new Date(exam.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '-'

  const date = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(start)

  return `${date} · ${formatTimeRange(exam.startTime, exam.endTime)}`
}

export function getStudentExamAction(exam: StudentExamItem) {
  if (exam.canResume) return { label: 'Tiếp tục', primary: true }
  if (exam.canStart) return { label: 'Vào thi', primary: true }
  if (exam.status === 'COMPLETED') return { label: 'Xem kết quả', primary: false }
  return { label: 'Xem chi tiết', primary: false }
}

function groupExamsByDate(exams: StudentExamItem[]) {
  const groups = new Map<string, StudentExamItem[]>()

  for (const exam of exams) {
    const date = new Date(exam.startTime)
    if (Number.isNaN(date.getTime())) continue
    const key = formatDateKey(date)
    groups.set(key, [...(groups.get(key) ?? []), exam])
  }

  groups.forEach((items) => {
    items.sort((first, second) => (
      new Date(first.startTime).getTime() - new Date(second.startTime).getTime()
    ))
  })

  return groups
}

function appendDay(
  days: StudentCalendarDay[],
  date: Date,
  isCurrentMonth: boolean,
  today: string,
  examsByDate: Map<string, StudentExamItem[]>,
) {
  const dateString = formatDateKey(date)
  days.push({
    date,
    dateString,
    dayNumber: date.getDate(),
    isCurrentMonth,
    isToday: dateString === today,
    exams: examsByDate.get(dateString) ?? [],
  })
}
