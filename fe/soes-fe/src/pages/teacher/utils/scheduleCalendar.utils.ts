import type { ProctorAssignmentApiDto } from '../types/teacher-course-api.types'

export interface CalendarDayCell {
  date: Date
  dateString: string
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
  assignments: ProctorAssignmentApiDto[]
}

export function formatDateToYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function getCalendarDays(
  currentMonthDate: Date,
  assignments: ProctorAssignmentApiDto[],
): CalendarDayCell[] {
  const year = currentMonthDate.getFullYear()
  const month = currentMonthDate.getMonth()

  // First day of current month
  const firstDayOfMonth = new Date(year, month, 1)
  // Last day of current month
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const totalDaysInMonth = lastDayOfMonth.getDate()

  // Map assignments by YYYY-MM-DD
  const assignmentMap = new Map<string, ProctorAssignmentApiDto[]>()
  for (const item of assignments) {
    if (!item.startTime) continue
    const d = new Date(item.startTime)
    if (isNaN(d.getTime())) continue
    const key = formatDateToYMD(d)
    const list = assignmentMap.get(key) || []
    list.push(item)
    assignmentMap.set(key, list)
  }

  // Sort assignments within each day by startTime
  assignmentMap.forEach((list) => {
    list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
  })

  const todayStr = formatDateToYMD(new Date())
  const days: CalendarDayCell[] = []

  // Determine starting day of week (Monday = 1, Sunday = 0)
  // We want Monday as index 0, Sunday as index 6
  let startDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startDayOfWeek === -1) startDayOfWeek = 6 // Sunday -> 6

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const dayNumber = prevMonthLastDay - i
    const cellDate = new Date(year, month - 1, dayNumber)
    const dateString = formatDateToYMD(cellDate)
    days.push({
      date: cellDate,
      dateString,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateString === todayStr,
      assignments: assignmentMap.get(dateString) || [],
    })
  }

  // Current month days
  for (let i = 1; i <= totalDaysInMonth; i++) {
    const cellDate = new Date(year, month, i)
    const dateString = formatDateToYMD(cellDate)
    days.push({
      date: cellDate,
      dateString,
      dayNumber: i,
      isCurrentMonth: true,
      isToday: dateString === todayStr,
      assignments: assignmentMap.get(dateString) || [],
    })
  }

  // Always fix grid to EXACTLY 5 rows (35 cells)
  if (days.length < 35) {
    const remainingDays = 35 - days.length
    for (let i = 1; i <= remainingDays; i++) {
      const cellDate = new Date(year, month + 1, i)
      const dateString = formatDateToYMD(cellDate)
      days.push({
        date: cellDate,
        dateString,
        dayNumber: i,
        isCurrentMonth: false,
        isToday: dateString === todayStr,
        assignments: assignmentMap.get(dateString) || [],
      })
    }
  } else if (days.length > 35) {
    // If month + padding exceeds 35 days (e.g. 36 days),
    // remove the earliest leading padding days from previous month so all days of current month fit cleanly in 35 cells (5 rows)
    const overflowCount = days.length - 35
    days.splice(0, overflowCount)
  }

  return days
}

export function formatTimeRange(startTime: string, endTime: string): string {
  const start = new Date(startTime)
  const end = new Date(endTime)
  const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false })
  return `${time.format(start)} - ${time.format(end)}`
}

export function formatFullDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}
