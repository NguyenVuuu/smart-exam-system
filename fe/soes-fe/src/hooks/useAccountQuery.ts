import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useCallback, useMemo } from 'react'
import { useAuthStore } from '../store/authStore'

/** Scope private reads without adding automatic retries or background refreshes. */
export function useAccountQuery<T>(key: readonly unknown[], load: () => Promise<T>, enabled = true) {
  const ownerId = useAuthStore(state => state.user?.id)
  const role = useAuthStore(state => state.user?.role)
  const client = useQueryClient()
  const signature = JSON.stringify(['account', ownerId, role, ...key])
  const queryKey = useMemo(() => JSON.parse(signature) as unknown[], [signature])
  const query = useQuery({
    queryKey, queryFn: load, enabled, gcTime: 0, retry: false,
    refetchOnWindowFocus: false, refetchOnReconnect: false,
  })
  const setData = useCallback((update: T | ((current: T | undefined) => T | undefined)) =>
    client.setQueryData<T>(queryKey, update), [client, queryKey])
  const { refetch } = query
  const reload = useCallback(async () => { if (enabled) await refetch() }, [enabled, refetch])
  return {
    data: query.data, error: query.error, isFetching: query.isFetching, isError: query.isError,
    setData, reload,
  }
}
