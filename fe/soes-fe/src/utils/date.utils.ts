/**
 * Tiện ích định dạng ngày giờ chuẩn xác theo múi giờ hệ thống (System Timezone)
 * và định dạng ngày cấu hình (Date Format Pattern).
 */

export type DateFormatPattern = 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'DD-MM-YYYY'

const DEFAULT_TIMEZONE = 'Asia/Ho_Chi_Minh'
const DEFAULT_DATE_FORMAT: DateFormatPattern = 'DD/MM/YYYY'

export function getSystemTimezone(): string {
  try {
    return localStorage.getItem('soes_system_timezone') || DEFAULT_TIMEZONE
  } catch {
    return DEFAULT_TIMEZONE
  }
}

export function getSystemDateFormat(): DateFormatPattern {
  try {
    return (localStorage.getItem('soes_system_date_format') as DateFormatPattern) || DEFAULT_DATE_FORMAT
  } catch {
    return DEFAULT_DATE_FORMAT
  }
}

export function updateClientSystemDateTimeSettings(timezone?: string, dateFormat?: string) {
  try {
    if (timezone) localStorage.setItem('soes_system_timezone', timezone)
    if (dateFormat) localStorage.setItem('soes_system_date_format', dateFormat)
  } catch {
    // Ignore storage error
  }
}

export interface ParsedDateTime {
  date: string // YYYY-MM-DD
  time: string // HH:mm
  day: string
  month: string
  year: string
  hours: string
  minutes: string
  isValid: boolean
}

/**
 * Phân tích chuỗi ngày giờ (ISO string, UTC, timestamp) thành các phần tử theo múi giờ hệ thống.
 */
export function parseDateTimeParts(value?: string | null, customTimezone?: string): ParsedDateTime {
  if (!value) {
    return { date: '', time: '', day: '', month: '', year: '', hours: '', minutes: '', isValid: false }
  }

  const dateObj = new Date(value)
  if (!isNaN(dateObj.getTime())) {
    const tz = customTimezone || getSystemTimezone()
    try {
      const formatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: tz,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      })
      const parts = formatter.formatToParts(dateObj)
      const day = parts.find((p) => p.type === 'day')?.value || '01'
      const month = parts.find((p) => p.type === 'month')?.value || '01'
      const year = parts.find((p) => p.type === 'year')?.value || '1970'
      const hours = parts.find((p) => p.type === 'hour')?.value || '00'
      const minutes = parts.find((p) => p.type === 'minute')?.value || '00'

      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        day,
        month,
        year,
        hours,
        minutes,
        isValid: true,
      }
    } catch {
      const year = String(dateObj.getFullYear())
      const month = String(dateObj.getMonth() + 1).padStart(2, '0')
      const day = String(dateObj.getDate()).padStart(2, '0')
      const hours = String(dateObj.getHours()).padStart(2, '0')
      const minutes = String(dateObj.getMinutes()).padStart(2, '0')

      return {
        date: `${year}-${month}-${day}`,
        time: `${hours}:${minutes}`,
        day,
        month,
        year,
        hours,
        minutes,
        isValid: true,
      }
    }
  }

  // Fallback nếu chuỗi không parse được chuẩn Date
  const [rawDate = '', rawTime = ''] = value.includes('T') ? value.split('T') : value.split(' ')
  const [year = '', month = '', day = ''] = rawDate.split('-')
  const time = rawTime.slice(0, 5)

  return {
    date: rawDate,
    time,
    day,
    month,
    year,
    hours: time.slice(0, 2),
    minutes: time.slice(3, 5),
    isValid: Boolean(rawDate),
  }
}

function renderFormattedDate(day: string, month: string, year: string, formatPattern = getSystemDateFormat()): string {
  switch (formatPattern) {
    case 'YYYY-MM-DD':
      return `${year}-${month}-${day}`
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`
    case 'DD/MM/YYYY':
    default:
      return `${day}/${month}/${year}`
  }
}

/**
 * Định dạng ngày: DD/MM/YYYY (hoặc YYYY-MM-DD tùy theo cấu hình hệ thống)
 */
export function formatDate(value?: string | null, customFormat?: DateFormatPattern): string {
  const parts = parseDateTimeParts(value)
  if (!parts.isValid) return '-'
  return renderFormattedDate(parts.day, parts.month, parts.year, customFormat)
}

/**
 * Định dạng giờ: HH:mm
 */
export function formatTime(value?: string | null): string {
  const parts = parseDateTimeParts(value)
  if (!parts.isValid) return '-'
  return parts.time
}

/**
 * Định dạng ngày và giờ theo cấu hình hệ thống
 */
export function formatDateTime(value?: string | null, customFormat?: DateFormatPattern): string {
  const parts = parseDateTimeParts(value)
  if (!parts.isValid) return '-'
  return `${renderFormattedDate(parts.day, parts.month, parts.year, customFormat)} ${parts.time}`
}

/**
 * Định dạng khoảng thời gian ca thi theo cấu hình hệ thống
 */
export function formatSessionRange(startTime?: string | null, endTime?: string | null, customFormat?: DateFormatPattern): string {
  if (!startTime) return '-'
  const start = parseDateTimeParts(startTime)
  const end = parseDateTimeParts(endTime)

  if (!start.isValid) return '-'
  const formattedDate = renderFormattedDate(start.day, start.month, start.year, customFormat)

  if (!end.isValid) {
    return `${formattedDate} · ${start.time}`
  }

  return `${formattedDate} · ${start.time} - ${end.time}`
}

