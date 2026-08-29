import { useCallback, useEffect, useState } from 'react'
import { getSemesters } from '../api/admin-academic.api'
import * as api from '../api/admin-management.api'
import { toAcademicYear } from '../mappers/admin-academic.mapper'
import { toAdminUser, toCourseOffering, toDepartment, toSubject } from '../mappers/admin-management.mapper'
import type { CourseOfferingPayload } from '../types/admin-api.types'
import type { AcademicYear, AdminSubject, AdminUser, CourseOfferingAdmin, Department } from '../types/admin.types'

export function useAdminClassSections() {
  const [items, setItems] = useState<CourseOfferingAdmin[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [semesters, setSemesters] = useState<AcademicYear[]>([])
  const [teachers, setTeachers] = useState<AdminUser[]>([])
  const [students, setStudents] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [coursePage, departmentPage, subjectPage, semesterPage, userPage] = await Promise.all([
        api.getCourseOfferings(), api.getDepartments(), api.getSubjects(), getSemesters(), api.getUsers(),
      ])
      const users = userPage.items.map(toAdminUser)
      setItems(coursePage.items.map(toCourseOffering)); setDepartments(departmentPage.items.map(toDepartment))
      setSubjects(subjectPage.items.map(toSubject)); setSemesters(semesterPage.items.map(toAcademicYear))
      setTeachers(users.filter(({ role }) => role === 'TEACHER'))
      setStudents(users.filter(({ role }) => role === 'STUDENT'))
    } catch { setError('Không thể tải danh sách lớp học phần.') }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { void load() }, [load])
  const save = async (id: string | null, payload: CourseOfferingPayload) => {
    await api.saveCourseOffering(id, payload); await load()
  }
  const enroll = async (courseId: string, studentIds: string[]) => {
    await api.enrollStudents(courseId, studentIds); await load()
  }
  return { items, departments, subjects, semesters, teachers, students, loading, error, retry: load, save, enroll }
}
