import type { Prisma } from '@prisma/client'
import type { AdminAuditLogDetailDto, AdminAuditLogDto, AuditActorDto } from '../dtos/admin-audit-log.dto'

export const auditLogUserSelect = {
  id: true,
  fullName: true,
  email: true,
  admins: { select: { adminCode: true, role: true }, take: 1 },
  teachers: { select: { teacherCode: true }, take: 1 },
  students: { select: { studentCode: true }, take: 1 },
} satisfies Prisma.UserSelect

type AuditLogWithUser = Prisma.AuditLogGetPayload<{ include: { user: { select: typeof auditLogUserSelect } } }>

const toActorDto = (user: AuditLogWithUser['user']): AuditActorDto => {
  const admin = user.admins[0]
  const teacher = user.teachers[0]
  const student = user.students[0]
  if (admin) return { id: user.id, code: admin.adminCode, fullName: user.fullName, email: user.email, role: admin.role }
  if (teacher) return { id: user.id, code: teacher.teacherCode, fullName: user.fullName, email: user.email, role: 'TEACHER' }
  if (student) return { id: user.id, code: student.studentCode, fullName: user.fullName, email: user.email, role: 'STUDENT' }
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
