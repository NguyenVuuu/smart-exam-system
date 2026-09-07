import type { Prisma } from '@prisma/client'
import { currentAuditRequestContext } from '../../middlewares/auditRequestContext'

type AuditLogClient = Pick<Prisma.TransactionClient, 'auditLog'>
type AuditLogWrite = Pick<
  Prisma.AuditLogUncheckedCreateInput,
  'userId' | 'action' | 'entityType' | 'entityId' | 'metadata'
>

export const writeAuditLog = (client: AuditLogClient, auditLog: AuditLogWrite) => {
  const requestContext = currentAuditRequestContext()
  return client.auditLog.create({
    data: {
      ...auditLog,
      ipAddress: requestContext?.ipAddress,
      userAgent: requestContext?.userAgent,
    },
  })
}
