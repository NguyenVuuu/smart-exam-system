import { NotFoundError, ValidationError } from '../../../errors/AppError'
import { toPagination } from '../../../utils/pagination'
import { toAdminAuditLogDetailDto, toAdminAuditLogDto } from '../mappers/admin-audit-log.mapper'
import * as repository from '../repositories/admin-audit-logs.repository'
import type { AuditLogFilter, AuditLogQuery } from '../validators/admin-audit-logs.validator'
import { toAuditLogCsv } from './audit-log-export.service'

const EXPORT_LIMIT = 10_000

export const listAuditLogs = async (query: AuditLogQuery) => {
  const [total, rows] = await repository.listAuditLogs(query)
  return { items: rows.map(toAdminAuditLogDto), pagination: toPagination(query.page, query.pageSize, total) }
}

export const getAuditLog = async (id: string) => {
  const row = await repository.findAuditLogById(id)
  if (!row) throw new NotFoundError('Audit log not found')
  return toAdminAuditLogDetailDto(row)
}

export const getAuditLogOverview = async () => {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const overview = await repository.getAuditLogOverview(todayStart)
  return {
    totalLogs: overview.totalLogs,
    todayLogs: overview.todayLogs,
    actorCount: overview.actorCount,
    actionCount: overview.actions.length,
    actions: overview.actions.map(({ action }) => action),
    entityTypes: overview.entityTypes.map(({ entityType }) => entityType),
  }
}

export const exportAuditLogs = async (filter: AuditLogFilter) => {
  const total = await repository.countAuditLogs(filter)
  if (total > EXPORT_LIMIT) {
    throw new ValidationError(`Audit log export is limited to ${EXPORT_LIMIT} records; narrow the filters`)
  }
  const rows = await repository.listAuditLogsForExport(filter, EXPORT_LIMIT)
  return toAuditLogCsv(rows.map(toAdminAuditLogDetailDto))
}
