import { formatDate, formatSessionRange, parseDateTimeParts } from '../../../../../utils/date.utils'
import type { ExamSchedule } from '../../../types/teacher-exam.types'

export function formatSessionTime(session: ExamSchedule) {
  return formatSessionRange(session.startTime, session.endTime)
}

export function parseSessionDateTime(value: string) {
  return parseDateTimeParts(value)
}

export function formatDisplayDate(date: string) {
  return formatDate(date)
}
