import type { Prisma } from '@prisma/client'
import type { AdminAuditLogDetailDto, AdminAuditLogDto, AuditActorDto } from '../dtos/admin-audit-log.dto'

export const auditLogUserSelect = {
  id: true,
  fullName: true,
  email: true,
  admin: { select: { adminCode: true } },
  teacher: { select: { teacherCode: true } },
  student: { select: { studentCode: true } },
} satisfies Prisma.UserSelect

type AuditLogWithUser = Prisma.AuditLogGetPayload<{ include: { user: { select: typeof auditLogUserSelect } } }>

const toActorDto = (user: AuditLogWithUser['user']): AuditActorDto => {
  if (user.admin) return { id: user.id, code: user.admin.adminCode, fullName: user.fullName, email: user.email, role: 'ADMIN' }
  if (user.teacher) return { id: user.id, code: user.teacher.teacherCode, fullName: user.fullName, email: user.email, role: 'TEACHER' }
  if (user.student) return { id: user.id, code: user.student.studentCode, fullName: user.fullName, email: user.email, role: 'STUDENT' }
  return { id: user.id, code: null, fullName: user.fullName, email: user.email, role: 'UNKNOWN' }
}

export const toAdminAuditLogDto = (row: AuditLogWithUser): AdminAuditLogDto => ({
  id: row.id,
  action: row.action,
  entityType: row.entityType,
  entityId: row.entityId,
  createdAt: row.createdAt,
  ipAddress: row.ipAddress,
  actor: toActorDto(row.user),
})

export const toAdminAuditLogDetailDto = (row: AuditLogWithUser): AdminAuditLogDetailDto => ({
  ...toAdminAuditLogDto(row),
  userAgent: row.userAgent,
  metadata: row.metadata,
})
