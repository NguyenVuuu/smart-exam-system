import { useAccountQuery } from '../../../hooks/useAccountQuery'
import { getAdminProctoringOverview, getAdminReportsOverview } from '../api/admin-monitoring.api'

export function useAdminProctoringOverview() {
  const query = useAccountQuery(['admin-proctoring'], getAdminProctoringOverview)
  return { rows: query.data ?? [], loading: query.isFetching,
    error: query.isError ? 'Không thể tải dữ liệu giám sát ca thi.' : null, retry: query.reload }
}

export function useAdminReportsOverview() {
  const query = useAccountQuery(['admin-reports'], getAdminReportsOverview)
  return { data: query.data ?? null, loading: query.isFetching,
    error: query.isError ? 'Không thể tải dữ liệu báo cáo.' : null, retry: query.reload }
}
