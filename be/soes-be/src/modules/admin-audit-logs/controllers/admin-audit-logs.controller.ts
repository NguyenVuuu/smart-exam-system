import type { Request, Response } from 'express'
import { sendSuccess } from '../../../utils/httpResponse'
import * as service from '../services/admin-audit-logs.service'
import { auditLogFilterSchema, auditLogParamSchema, auditLogQuerySchema } from '../validators/admin-audit-logs.validator'

export const listAuditLogs = async (req: Request, res: Response) => {
  sendSuccess(res, await service.listAuditLogs(auditLogQuerySchema.parse(req.query)))
}

export const getAuditLogOverview = async (_req: Request, res: Response) => {
  sendSuccess(res, await service.getAuditLogOverview())
}

export const getAuditLog = async (req: Request, res: Response) => {
  sendSuccess(res, await service.getAuditLog(auditLogParamSchema.parse(req.params).id))
}

export const exportAuditLogs = async (req: Request, res: Response) => {
  const csv = await service.exportAuditLogs(auditLogFilterSchema.parse(req.query))
  const filename = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
  res.send(csv)
}
