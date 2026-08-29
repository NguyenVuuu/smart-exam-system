import { useEffect, useState } from 'react'
import { getTeacherCourses } from '../api/teacher-courses.api'
import type { CourseOffering } from '../types/teacher-course.types'

export function useTeacherCourses() {
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    getTeacherCourses().then((rows) => {
      if (!active) return
      setCourses(rows.map((row) => ({
        id: row.id, courseCode: row.code, status: row.status,
        semesterId: row.semester.id, semesterName: row.semester.name,
        subjectId: row.subject.id, subjectCode: row.subject.code, subjectName: row.subject.name,
        teacherName: '', totalStudents: row.enrollmentCount, totalExams: row.scheduleCount,
      })))
    }).catch(() => active && setError('Không thể tải danh sách lớp học phần.'))
      .finally(() => active && setLoading(false))
    return () => { active = false }
  }, [version])

  const retry = () => {
    setLoading(true)
    setError(null)
    setVersion((value) => value + 1)
  }
  return { courses, loading, error, retry }
}
