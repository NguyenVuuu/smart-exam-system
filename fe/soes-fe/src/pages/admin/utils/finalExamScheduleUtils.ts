import { PROCTOR_TURNOVER_MINUTES } from '../constants/finalExamScheduleOptions'
import type { AdminExamSchedule } from '../types/admin.types'

export function findExistingProctorConflict(
  schedules: AdminExamSchedule[],
  teacherName: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  if (!date || !startTime || !endTime) return null
  const displayDate = formatDate(date)

  return schedules.find((schedule) => {
    if (schedule.status === 'CANCELLED' || schedule.date !== displayDate || !schedule.proctors.includes(teacherName)) {
      return false
    }
    const [existingStart, existingEnd] = schedule.time.split(' - ')
    return toMinutes(startTime) < toMinutes(existingEnd) + PROCTOR_TURNOVER_MINUTES
      && toMinutes(existingStart) - PROCTOR_TURNOVER_MINUTES < toMinutes(endTime)
  }) ?? null
}

export function hasCourseConflict(
  schedules: AdminExamSchedule[],
  courseCode: string,
  date: string,
  startTime: string,
  endTime: string,
) {
  if (!date || !startTime || !endTime) return false
  const displayDate = formatDate(date)

  return schedules.some((schedule) => {
    if (schedule.status === 'CANCELLED' || schedule.date !== displayDate || !schedule.courseCodes.includes(courseCode)) {
      return false
    }
    const [existingStart, existingEnd] = schedule.time.split(' - ')
    return toMinutes(startTime) < toMinutes(existingEnd) && toMinutes(existingStart) < toMinutes(endTime)
  })
}

export function toMinutes(time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return (hours * 60) + minutes
}

export function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return year && month && day ? `${day}/${month}/${year}` : date
}

export function toInputDate(date: string) {
  const [day, month, year] = date.split('/')
  return year && month && day ? `${year}-${month}-${day}` : date
}

export function findOptionValue(
  options: Array<{ value: string; label: string }>,
  label: string,
  fallback: string,
) {
  return options.find((option) => option.label === label)?.value ?? fallback
}
