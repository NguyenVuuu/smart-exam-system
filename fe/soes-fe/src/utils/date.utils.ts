/**
 * Tiện ích định dạng ngày giờ chuẩn xác theo múi giờ địa phương (local timezone).
 * Hỗ trợ chuyển đổi chuỗi ISO từ server (UTC) sang ngày giờ hiển thị chuẩn Việt Nam.
 */

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
 * Phân tích chuỗi ngày giờ (ISO string, UTC, timestamp) thành các phần tử theo múi giờ máy khách.
 */
export function parseDateTimeParts(value?: string | null): ParsedDateTime {
  if (!value) {
    return { date: '', time: '', day: '', month: '', year: '', hours: '', minutes: '', isValid: false }
  }

  const dateObj = new Date(value)
  if (!isNaN(dateObj.getTime())) {
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

/**
 * Định dạng ngày: DD/MM/YYYY
 * Ví dụ: "29/08/2026"
 */
export function formatDate(value?: string | null): string {
  const parts = parseDateTimeParts(value)
  if (!parts.isValid) return '-'
  return `${parts.day}/${parts.month}/${parts.year}`
}

/**
 * Định dạng giờ: HH:mm
 * Ví dụ: "10:18"
 */
export function formatTime(value?: string | null): string {
  const parts = parseDateTimeParts(value)
  if (!parts.isValid) return '-'
  return parts.time
}

/**
 * Định dạng ngày và giờ: DD/MM/YYYY HH:mm
 * Phù hợp hiển thị ngày gửi, ngày tạo, mốc thời gian hệ thống.
 * Ví dụ: "29/08/2026 10:18"
 */
export function formatDateTime(value?: string | null): string {
  const parts = parseDateTimeParts(value)
  if (!parts.isValid) return '-'
  return `${parts.day}/${parts.month}/${parts.year} ${parts.time}`
}

/**
 * Định dạng khoảng thời gian ca thi: DD/MM/YYYY · HH:mm - HH:mm
 * Ví dụ: "29/08/2026 · 10:18 - 11:18"
 */
export function formatSessionRange(startTime?: string | null, endTime?: string | null): string {
  if (!startTime) return '-'
  const start = parseDateTimeParts(startTime)
  const end = parseDateTimeParts(endTime)

  if (!start.isValid) return '-'
  const formattedDate = `${start.day}/${start.month}/${start.year}`

  if (!end.isValid) {
    return `${formattedDate} · ${start.time}`
  }

  return `${formattedDate} · ${start.time} - ${end.time}`
}
