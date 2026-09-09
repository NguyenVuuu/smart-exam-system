import { useQuery } from '@tanstack/react-query'
import { getApiErrorMessage } from '../../../api/errors'
import { getAdminSystemSettings } from '../api/admin-system-settings.api'

export function useAdminSystemSettings() {
  const query = useQuery({
    queryKey: ['admin-system-settings'],
    queryFn: getAdminSystemSettings,
    staleTime: 30_000,
  })

  return {
    data: query.data ?? null,
    loading: query.isPending || query.isFetching,
    error: query.error
      ? getApiErrorMessage(query.error, 'Không thể tải cấu hình hệ thống.')
      : null,
    refresh: query.refetch,
  }
}
