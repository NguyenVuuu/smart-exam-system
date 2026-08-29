import { useEffect, useState } from 'react'
import { getCourseExams, getCourseStudents } from '../api/teacher-courses.api'
import type { CourseExamSchedule, StudentEnrollment } from '../types/teacher-course.types'

const emptyPage = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

export function useTeacherCourseCollections(courseId?: string) {
  const [studentPage, setStudentPage] = useState(1)
  const [examPage, setExamPage] = useState(1)
  const [studentKeyword, setStudentKeyword] = useState('')
  const [students, setStudents] = useState<StudentEnrollment[]>([])
  const [exams, setExams] = useState<CourseExamSchedule[]>([])
  const [studentPagination, setStudentPagination] = useState(emptyPage)
  const [examPagination, setExamPagination] = useState(emptyPage)

  useEffect(() => {
    if (!courseId) return
    let active = true
    getCourseStudents(courseId, studentPage, studentKeyword).then((data) => {
      if (!active) return
      setStudents(data.items.map((item) => ({
        ...item, email: item.email ?? '', status: 'ACTIVE',
        enrolledAt: new Intl.DateTimeFormat('vi-VN').format(new Date(item.enrolledAt)),
      })))
      setStudentPagination(data.pagination)
    })
    return () => { active = false }
  }, [courseId, studentKeyword, studentPage])

  useEffect(() => {
    if (!courseId) return
    let active = true
    getCourseExams(courseId, examPage).then((data) => {
      if (!active) return
      setExams(data.items)
      setExamPagination(data.pagination)
    })
    return () => { active = false }
  }, [courseId, examPage])

  return {
    students, exams, studentPage, examPage, studentKeyword, studentPagination, examPagination,
    setStudentPage, setExamPage,
    setStudentKeyword: (value: string) => { setStudentKeyword(value); setStudentPage(1) },
  }
}
