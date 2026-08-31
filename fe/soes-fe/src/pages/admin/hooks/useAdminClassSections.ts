import { useCallback, useEffect, useState } from 'react'
import { getSemesters } from '../api/admin-academic.api'
import * as api from '../api/admin-management.api'
import { toAcademicYear } from '../mappers/admin-academic.mapper'
import { toAdminUser, toCourseEnrollment, toCourseOffering, toDepartment, toSubject } from '../mappers/admin-management.mapper'
import type { CourseOfferingPayload } from '../types/admin-api.types'
import type { AcademicYear, AdminSubject, AdminUser, CourseEnrollmentAdmin, CourseOfferingAdmin, Department } from '../types/admin.types'

interface ClassSectionFilters {
  keyword: string
  semesterId: string
  departmentId: string
  subjectId: string
  status: 'ALL' | CourseOfferingAdmin['status']
}

export function useAdminClassSections(filters: ClassSectionFilters) {
  const [items, setItems] = useState<CourseOfferingAdmin[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [subjects, setSubjects] = useState<AdminSubject[]>([])
  const [semesters, setSemesters] = useState<AcademicYear[]>([])
  const [teachers, setTeachers] = useState<AdminUser[]>([])
  const [students, setStudents] = useState<AdminUser[]>([])
  const [enrollments, setEnrollments] = useState<CourseEnrollmentAdmin[]>([])
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadReferences = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const [departmentPage, subjectPage, semesterPage, userPage] = await Promise.all([
        api.getDepartments(), api.getSubjects(), getSemesters(), api.getUsers(),
      ])
      const users = userPage.items.map(toAdminUser)
      setDepartments(departmentPage.items.map(toDepartment))
      setSubjects(subjectPage.items.map(toSubject)); setSemesters(semesterPage.items.map(toAcademicYear))
      setTeachers(users.filter(({ role }) => role === 'TEACHER'))
      setStudents(users.filter(({ role }) => role === 'STUDENT'))
    } catch { setError('Không thể tải danh sách lớp học phần.') }
    finally { setLoading(false) }
  }, [])

  const loadCourses = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const coursePage = await api.getCourseOfferings({
        ...(filters.keyword.trim() && { keyword: filters.keyword.trim() }),
        ...(filters.semesterId && { semesterId: filters.semesterId }),
        ...(filters.departmentId !== 'ALL' && { departmentId: filters.departmentId }),
        ...(filters.subjectId !== 'ALL' && { subjectId: filters.subjectId }),
        ...(filters.status !== 'ALL' && { status: filters.status === 'OPEN' ? 'ACTIVE' : 'CLOSED' }),
      })
      setItems(coursePage.items.map(toCourseOffering))
    } catch { setError('Không thể tải danh sách lớp học phần.') }
    finally { setLoading(false) }
  }, [filters.departmentId, filters.keyword, filters.semesterId, filters.status, filters.subjectId])

  useEffect(() => {
    // The callback performs the asynchronous API synchronization for this hook.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadReferences()
  }, [loadReferences])
  useEffect(() => {
    // Reload server-filtered rows whenever the filter contract changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadCourses()
  }, [loadCourses])

  const loadEnrollments = async (courseId: string) => {
    setEnrollmentsLoading(true)
    try {
      const page = await api.getCourseEnrollments(courseId)
      setEnrollments(page.items.map(toCourseEnrollment))
    } finally { setEnrollmentsLoading(false) }
  }
  const save = async (id: string | null, payload: CourseOfferingPayload) => {
    await api.saveCourseOffering(id, payload); await loadCourses()
  }
  const enroll = async (courseId: string, studentIds: string[]) => {
    await api.enrollStudents(courseId, studentIds)
    await Promise.all([loadCourses(), loadEnrollments(courseId)])
  }
  const withdraw = async (courseId: string, studentId: string) => {
    await api.withdrawStudent(courseId, studentId)
    await Promise.all([loadCourses(), loadEnrollments(courseId)])
  }
  const retry = async () => { await Promise.all([loadReferences(), loadCourses()]) }
  return {
    items, departments, subjects, semesters, teachers, students, enrollments,
    loading, enrollmentsLoading, error, retry, save, enroll, withdraw, loadEnrollments,
  }
}
