export type AuditActorRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'UNKNOWN'

export interface AuditActorDto {
  id: string
  code: string | null
  fullName: string
  email: string | null
  role: AuditActorRole
}

export interface AdminAuditLogDto {
  id: string
  action: string
  entityType: string
  entityId: string
  createdAt: Date
  ipAddress: string | null
  actor: AuditActorDto
}

export interface AdminAuditLogDetailDto extends AdminAuditLogDto {
  userAgent: string | null
  metadata: unknown
}

export interface AdminAuditLogOverviewDto {
  totalLogs: number
  todayLogs: number
  actorCount: number
  actionCount: number
  actions: string[]
  entityTypes: string[]
}
