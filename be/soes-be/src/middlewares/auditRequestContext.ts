import { AsyncLocalStorage } from 'node:async_hooks'
import type { NextFunction, Request, Response } from 'express'

interface AuditRequestContext {
  ipAddress: string | null
  userAgent: string | null
}

const auditRequestStorage = new AsyncLocalStorage<AuditRequestContext>()

const normalizeIpAddress = (ipAddress?: string) => {
  if (!ipAddress) return null
  const normalizedAddress = ipAddress.startsWith('::ffff:') ? ipAddress.slice(7) : ipAddress
  return normalizedAddress.slice(0, 64)
}

export const clientRequestContext = (request: Request): AuditRequestContext => ({
  ipAddress: normalizeIpAddress(request.ip ?? request.socket.remoteAddress),
  userAgent: request.get('user-agent')?.slice(0, 1000) ?? null,
})

export const auditRequestContext = (request: Request, _response: Response, next: NextFunction) => {
  auditRequestStorage.run(clientRequestContext(request), next)
}

export const currentAuditRequestContext = () => auditRequestStorage.getStore()
