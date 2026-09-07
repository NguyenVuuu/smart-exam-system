import type { AdminAuditLogDetailDto } from '../dtos/admin-audit-log.dto'

const protectSpreadsheetCell = (cellText: string) => /^[=+\-@]/.test(cellText) ? `'${cellText}` : cellText
const csvCell = (cellContent: unknown) => `"${protectSpreadsheetCell(String(cellContent ?? '')).replace(/"/g, '""')}"`

export const toAuditLogCsv = (rows: AdminAuditLogDetailDto[]) => {
  const header = ['Thời gian', 'Mã người dùng', 'Người thực hiện', 'Vai trò', 'Email', 'Hành động', 'Loại đối tượng', 'ID đối tượng', 'IP', 'Thiết bị', 'Dữ liệu chi tiết']
  const lines = rows.map((row) => [
    row.createdAt.toISOString(), row.actor.code, row.actor.fullName, row.actor.role, row.actor.email,
    row.action, row.entityType, row.entityId, row.ipAddress, row.userAgent,
    row.metadata ? JSON.stringify(row.metadata) : '',
  ].map(csvCell).join(','))
  return `\uFEFF${header.map(csvCell).join(',')}\n${lines.join('\n')}`
}
