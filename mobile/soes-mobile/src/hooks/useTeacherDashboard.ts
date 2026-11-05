import { useCallback, useEffect, useState } from 'react'
import { getTeacherDashboard } from '../api/teacher-dashboard.api'
import type { DashboardData } from '../types/teacher-dashboard.types'

export function useTeacherDashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const refresh = useCallback(async () => {
    setRefreshing(true)
    try { setData(await getTeacherDashboard()) }
    finally { setLoading(false); setRefreshing(false) }
  }, [])

  useEffect(() => {
    let active = true
    getTeacherDashboard().then((result) => {
      if (active) setData(result)
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])
  return { data, loading, refreshing, refresh }
}
