import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/admin-academic.api'
import { toAcademicYear } from '../mappers/admin-academic.mapper'
import type { SemesterPayload } from '../types/admin-api.types'
import type { AcademicYear } from '../types/admin.types'

export function useAdminSemesters() {
  const [items, setItems] = useState<AcademicYear[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const page = await api.getSemesters()
      setItems(page.items.map(toAcademicYear))
    } catch {
      setError('Không thể tải danh sách học kỳ.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const create = async (payload: SemesterPayload) => {
    const created = toAcademicYear(await api.createSemester(payload))
    setItems((current) => [...current, created])
    return created
  }

  const activate = async (id: string) => {
    const activated = toAcademicYear(await api.activateSemester(id))
    setItems((current) => current.map((item) => ({
      ...item,
      isCurrent: item.id === id,
      status: item.id === id ? activated.status : item.status === 'ACTIVE' ? 'CLOSED' : item.status,
    })))
    return activated
  }

  return { items, loading, error, create, activate, retry: load }
}
