import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { getAdminAuditLogOverview, getAdminAuditLogs, type AuditLogFilters } from '../api/admin-audit-logs.api'

export const useAdminAuditLogs = (filters: AuditLogFilters) => {
  const logs = useQuery({
    queryKey: ['admin', 'audit-logs', filters],
    queryFn: () => getAdminAuditLogs(filters),
    placeholderData: keepPreviousData,
  })
  const overview = useQuery({
    queryKey: ['admin', 'audit-logs', 'overview'],
    queryFn: getAdminAuditLogOverview,
  })

  const refresh = async () => {
    await Promise.all([logs.refetch(), overview.refetch()])
  }

  return { logs, overview, refresh }
}
