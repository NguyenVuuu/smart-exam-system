import { useEffect, useState } from 'react'
import { getTeacherCourses } from '../api/teacher-courses.api'
import type { CourseOffering } from '../types/teacher-course.types'

export function useTeacherCourses() {
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [semesterOptions, setSemesterOptions] = useState<Array<{ value: string; label: string }>>([])
  const [currentSemesterId, setCurrentSemesterId] = useState<string | null>(null)
  const [currentSemesterName, setCurrentSemesterName] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    getTeacherCourses().then((data) => {
      if (!active) return
      setCourses(data.items.map((row) => ({
        id: row.id, courseCode: row.code, status: row.status,
        semesterId: row.semester.id, semesterCode: row.semester.code, semesterName: row.semester.name,
        semesterStatus: row.semester.status,
        subjectId: row.subject.id, subjectCode: row.subject.code, subjectName: row.subject.name,
        teacherName: '', totalStudents: row.enrollmentCount, totalExams: row.scheduleCount,
      })))
      setCurrentSemesterId(data.currentSemesterId)
      setCurrentSemesterName(
        data.semesterOptions.find(({ id }) => id === data.currentSemesterId)?.name ?? null,
      )
      setSemesterOptions(data.semesterOptions.map((semester) => ({
        value: semester.id,
        label: `${semester.name}${semester.status === 'ACTIVE' ? ' (Hiện tại)' : ''}`,
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
  return { courses, semesterOptions, currentSemesterId, currentSemesterName, loading, error, retry }
}
