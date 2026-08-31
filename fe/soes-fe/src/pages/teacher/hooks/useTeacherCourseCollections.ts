import { useEffect, useState } from 'react'
import { getCourseExams, getCourseGradebook, getCourseStudents } from '../api/teacher-courses.api'
import type { CourseGradebookApiDto } from '../types/teacher-course-api.types'
import type { CourseExamSchedule, StudentEnrollment } from '../types/teacher-course.types'

const emptyPage = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

export function useTeacherCourseCollections(courseId?: string) {
  const [studentPage, setStudentPage] = useState(1)
  const [examPage, setExamPage] = useState(1)
  const [scorePage, setScorePage] = useState(1)
  const [studentKeyword, setStudentKeyword] = useState('')
  const [students, setStudents] = useState<StudentEnrollment[]>([])
  const [exams, setExams] = useState<CourseExamSchedule[]>([])
  const [studentPagination, setStudentPagination] = useState(emptyPage)
  const [examPagination, setExamPagination] = useState(emptyPage)
  const [gradebook, setGradebook] = useState<CourseGradebookApiDto>({ assessments: [], students: [], pagination: emptyPage })

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

  useEffect(() => {
    if (!courseId) return
    let active = true
    getCourseGradebook(courseId, scorePage).then((data) => { if (active) setGradebook(data) })
    return () => { active = false }
  }, [courseId, scorePage])

  return {
    students, exams, gradebook, studentPage, examPage, scorePage, studentKeyword, studentPagination, examPagination,
    setStudentPage, setExamPage, setScorePage,
    setStudentKeyword: (value: string) => { setStudentKeyword(value); setStudentPage(1) },
  }
}
