import type { Prisma } from '@prisma/client'
import prisma from '../../../lib/prisma'
import { auditLogUserSelect } from '../mappers/admin-audit-log.mapper'
import type { AuditLogFilter, AuditLogQuery } from '../validators/admin-audit-logs.validator'

const roleFilter = (role: AuditLogFilter['role']): Prisma.UserWhereInput | undefined => {
  if (role === 'ADMIN') return { admin: { isNot: null } }
  if (role === 'TEACHER') return { teacher: { isNot: null } }
  if (role === 'STUDENT') return { student: { isNot: null } }
  return undefined
}

export const buildAuditLogWhere = (filter: AuditLogFilter): Prisma.AuditLogWhereInput => ({
  ...(filter.action && { action: filter.action }),
  ...(filter.entityType && { entityType: filter.entityType }),
  ...((filter.from || filter.to) && {
    createdAt: {
      ...(filter.from && { gte: new Date(filter.from) }),
      ...(filter.to && { lte: new Date(filter.to) }),
    },
  }),
  ...(filter.role && { user: roleFilter(filter.role) }),
  ...(filter.keyword && {
    OR: [
      { action: { contains: filter.keyword, mode: 'insensitive' } },
      { entityType: { contains: filter.keyword, mode: 'insensitive' } },
      { entityId: { contains: filter.keyword, mode: 'insensitive' } },
      { ipAddress: { contains: filter.keyword, mode: 'insensitive' } },
      { user: { fullName: { contains: filter.keyword, mode: 'insensitive' } } },
      { user: { email: { contains: filter.keyword, mode: 'insensitive' } } },
      { user: { admin: { adminCode: { contains: filter.keyword, mode: 'insensitive' } } } },
      { user: { teacher: { teacherCode: { contains: filter.keyword, mode: 'insensitive' } } } },
      { user: { student: { studentCode: { contains: filter.keyword, mode: 'insensitive' } } } },
    ],
  }),
})

const auditLogInclude = { user: { select: auditLogUserSelect } } satisfies Prisma.AuditLogInclude

export const listAuditLogs = (query: AuditLogQuery) => {
  const where = buildAuditLogWhere(query)
  return Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      include: auditLogInclude,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ])
}

export const findAuditLogById = (id: string) => prisma.auditLog.findUnique({
  where: { id },
  include: auditLogInclude,
})

export const listAuditLogsForExport = (filter: AuditLogFilter, limit: number) => prisma.auditLog.findMany({
  where: buildAuditLogWhere(filter),
  include: auditLogInclude,
  orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
  take: limit,
})

export const countAuditLogs = (filter: AuditLogFilter) => prisma.auditLog.count({
  where: buildAuditLogWhere(filter),
})

export const getAuditLogOverview = async (todayStart: Date) => {
  const [totalLogs, todayLogs, actors, actions, entityTypes] = await Promise.all([
    prisma.auditLog.count(),
    prisma.auditLog.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.auditLog.findMany({ distinct: ['userId'], select: { userId: true } }),
    prisma.auditLog.findMany({ distinct: ['action'], select: { action: true }, orderBy: { action: 'asc' } }),
    prisma.auditLog.findMany({ distinct: ['entityType'], select: { entityType: true }, orderBy: { entityType: 'asc' } }),
  ])
  return { totalLogs, todayLogs, actorCount: actors.length, actions, entityTypes }
}
