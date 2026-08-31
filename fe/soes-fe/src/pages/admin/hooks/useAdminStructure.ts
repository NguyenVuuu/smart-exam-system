import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/admin-management.api'
import { toAdminUser, toDepartment, toSubject } from '../mappers/admin-management.mapper'
import type { DepartmentPayload, SubjectPayload } from '../types/admin-api.types'
import type { AdminSubject, AdminUser, Department } from '../types/admin.types'

export function useAdminStructure() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [teachers, setTeachers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [departmentPage, subjectPage, userPage] = await Promise.all([
        api.getDepartments(), api.getSubjects(), api.getUsers(),
      ])
      setDepartments(departmentPage.items.map(toDepartment))
      setSubjects(subjectPage.items.map(toSubject))
      setTeachers(userPage.items.filter(({ role }) => role === 'TEACHER').map(toAdminUser))
    } catch {
      setError('Không thể tải dữ liệu bộ môn và môn học.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

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

  return { departments, subjects, teachers, loading, error, retry: load, saveDepartment, saveSubject, setDepartmentHead }
}
