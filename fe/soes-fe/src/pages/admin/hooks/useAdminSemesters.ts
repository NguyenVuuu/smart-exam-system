import { useAccountQuery } from '../../../hooks/useAccountQuery'
import * as api from '../api/admin-academic.api'
import { toAcademicYear } from '../mappers/admin-academic.mapper'
import type { SemesterPayload } from '../types/admin-api.types'

export function useAdminSemesters() {
  const query = useAccountQuery(['admin-semesters'], async () => (await api.getSemesters()).items.map(toAcademicYear))
  const items = query.data ?? []

  const create = async (payload: SemesterPayload) => {
    const created = toAcademicYear(await api.createSemester(payload))
    query.setData(current => [...(current ?? []), created])
    return created
  }

  const activate = async (id: string) => {
    const activated = toAcademicYear(await api.activateSemester(id))
    query.setData((current) => (current ?? []).map((item) => ({
      ...item,
      isCurrent: item.id === id,
      status: item.id === id ? activated.status : item.status === 'ACTIVE' ? 'CLOSED' : item.status,
    })))
    return activated
  }

  return { items, loading: query.isFetching, error: query.isError ? 'Không thể tải danh sách học kỳ.' : null,
    create, activate, retry: query.reload }
}
