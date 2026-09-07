import { z } from 'zod'
import { paginationFields } from '../../../utils/pagination'

const optionalText = z.string().trim().max(200).optional()

export const auditLogFilterSchema = z.object({
  keyword: optionalText,
  action: optionalText,
  entityType: optionalText,
  role: z.enum(['ADMIN', 'TEACHER', 'STUDENT']).optional(),
  from: z.iso.datetime({ offset: true }).optional(),
  to: z.iso.datetime({ offset: true }).optional(),
}).refine(
  ({ from, to }) => !from || !to || new Date(from) <= new Date(to),
  { message: 'From date must be before to date', path: ['to'] },
)

export const auditLogQuerySchema = auditLogFilterSchema.extend(paginationFields)
export const auditLogParamSchema = z.object({ id: z.string().uuid() })

export type AuditLogFilter = z.infer<typeof auditLogFilterSchema>
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>
