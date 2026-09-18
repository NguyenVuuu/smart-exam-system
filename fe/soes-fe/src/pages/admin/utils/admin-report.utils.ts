import type { AdminReportRowDto } from '../api/admin-monitoring.api'

const CSV_HEADERS = ['Ca thi', 'Môn học', 'Lớp', 'Hoàn thành', 'Điểm TB', 'Cao nhất', 'Thấp nhất', 'Tỷ lệ đạt', 'Vi phạm']

export function exportAdminReportCsv(rows: AdminReportRowDto[]) {
  const reportRows = rows.map(toCsvReportRow)
  const csvContent = [CSV_HEADERS, ...reportRows].map(toCsvLine).join('\n')
  downloadCsv(csvContent, `bao-cao-thi-${new Date().toISOString().slice(0, 10)}.csv`)
}

function toCsvReportRow(report: AdminReportRowDto) {
  return [
    report.scheduleTitle,
    report.subject,
    report.course,
    `${report.submitted}/${report.participants}`,
    report.average,
    report.highest,
    report.lowest,
    `${report.passedRate}%`,
    report.violations,
  ]
}

function toCsvLine(cells: Array<string | number>) {
  return cells.map((cell) => `"${sanitizeCsvCell(cell).replaceAll('"', '""')}"`).join(',')
}

function sanitizeCsvCell(cell: string | number) {
  const text = String(cell)
  return /^[=+\-@]/.test(text) ? `'${text}` : text
}

function downloadCsv(content: string, filename: string) {
  const url = URL.createObjectURL(new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
