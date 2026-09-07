import { apiClient } from '../../../api/axios'
import type { AdminAuditLogApiDto, AdminAuditLogDetailApiDto, AdminAuditLogOverviewApiDto, ApiPage, ApiResponse } from '../types/admin-api.types'

export interface AuditLogFilters {
  page?: number
  pageSize?: number
  keyword?: string
  action?: string
  entityType?: string
  role?: 'ADMIN' | 'TEACHER' | 'STUDENT'
  from?: string
  to?: string
}

const unwrap = <T>({ data: response }: { data: ApiResponse<T> }) => response.data

export const getAdminAuditLogs = (params: AuditLogFilters) =>
  apiClient.get<ApiResponse<ApiPage<AdminAuditLogApiDto>>>('/admin/audit-logs', { params }).then(unwrap)

export const getAdminAuditLogOverview = () =>
  apiClient.get<ApiResponse<AdminAuditLogOverviewApiDto>>('/admin/audit-logs/overview').then(unwrap)

export const getAdminAuditLog = (id: string) =>
  apiClient.get<ApiResponse<AdminAuditLogDetailApiDto>>(`/admin/audit-logs/${id}`).then(unwrap)

export const exportAdminAuditLogs = (params: Omit<AuditLogFilters, 'page' | 'pageSize'>) =>
  apiClient.get<Blob>('/admin/audit-logs/export', { params, responseType: 'blob' })
    .then(({ data: auditLogFile }) => auditLogFile)
