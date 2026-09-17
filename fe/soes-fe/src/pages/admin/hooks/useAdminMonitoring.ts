import { useEffect, useState } from 'react'
import {
  getAdminProctoringOverview,
  getAdminReportsOverview,
  type AdminProctoringRowDto,
  type AdminReportsDto,
} from '../api/admin-monitoring.api'

export function useAdminProctoringOverview() {
  const [rows, setRows] = useState<AdminProctoringRowDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getAdminProctoringOverview()
      .then((data) => {
        if (!active) return
        setRows(data)
        setError(null)
      })
      .catch(() => active && setError('Không thể tải dữ liệu giám sát ca thi.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [version])

  return { rows, loading, error, retry: () => setVersion((value) => value + 1) }
}

export function useAdminReportsOverview() {
  const [data, setData] = useState<AdminReportsDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    setLoading(true)
    getAdminReportsOverview()
      .then((payload) => {
        if (!active) return
        setData(payload)
        setError(null)
      })
      .catch(() => active && setError('Không thể tải dữ liệu báo cáo.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [version])

  return { data, loading, error, retry: () => setVersion((value) => value + 1) }
}
