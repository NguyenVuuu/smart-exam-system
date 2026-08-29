import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/admin-management.api'
import { toAdminUser, toDepartment } from '../mappers/admin-management.mapper'
import type { UpdateUserPayload, UserPayload } from '../types/admin-api.types'
import type { AdminUser, Department } from '../types/admin.types'

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [userPage, departmentPage] = await Promise.all([api.getUsers(), api.getDepartments()])
      setUsers(userPage.items.map(toAdminUser))
      setDepartments(departmentPage.items.map(toDepartment))
    } catch {
      setError('Không thể tải danh sách người dùng.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const create = async (payload: UserPayload) => { await api.createUser(payload); await load() }
  const update = async (user: AdminUser, payload: UpdateUserPayload) => {
    if (!user.profileId) throw new Error('Missing profile id')
    await api.updateUser(user.role, user.profileId, payload)
    await load()
  }
  const setStatus = async (user: AdminUser, status: 'ACTIVE' | 'INACTIVE') => {
    if (!user.profileId) throw new Error('Missing profile id')
    await api.setUserStatus(user.role, user.profileId, status)
    await load()
  }
  const resetPassword = async (user: AdminUser) => {
    if (!user.profileId) throw new Error('Missing profile id')
    await api.resetUserPassword(user.role, user.profileId)
  }
  const setDepartmentHead = async (departmentId: string, teacherId: string | null) => {
    await api.assignDepartmentHead(departmentId, teacherId)
    await load()
  }

  return { users, departments, loading, error, retry: load, create, update, setStatus, resetPassword, setDepartmentHead }
}
