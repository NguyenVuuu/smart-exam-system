import { useAccountQuery } from '../../../hooks/useAccountQuery'
import * as api from '../api/admin-management.api'
import { toAdminUser, toDepartment, toSubject } from '../mappers/admin-management.mapper'
import type { DepartmentPayload, SubjectPayload } from '../types/admin-api.types'

export function useAdminStructure(loadTeachers = true) {
  const query = useAccountQuery(['admin-structure', loadTeachers], async () => {
    const [departmentPage, subjectPage, userPage] = await Promise.all([
      api.getDepartments(), api.getSubjects(), loadTeachers ? api.getUserReferences('TEACHER') : Promise.resolve({ items: [] }),
    ])
    return { departments: departmentPage.items.map(toDepartment), subjects: subjectPage.items.map(toSubject),
      teachers: userPage.items.filter(({ role }) => role === 'TEACHER').map(toAdminUser) }
  })
  const load = query.reload

  const saveDepartment = async (id: string | null, payload: DepartmentPayload, headId?: string | null) => {
    const saved = await api.saveDepartment(id, payload)
    if (headId !== undefined) await api.assignDepartmentHead(saved.id, headId)
    await load()
  }
  const saveSubject = async (id: string | null, payload: SubjectPayload) => {
    await api.saveSubject(id, payload)
    await load()
  }
  const setDepartmentHead = async (id: string, teacherId: string | null) => {
    await api.assignDepartmentHead(id, teacherId)
    await load()
  }

  return { departments: query.data?.departments ?? [], subjects: query.data?.subjects ?? [], teachers: query.data?.teachers ?? [],
    loading: query.isFetching, error: query.isError ? 'Không thể tải dữ liệu bộ môn và môn học.' : null,
    retry: load, saveDepartment, saveSubject, setDepartmentHead }
}
