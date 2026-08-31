import { useCallback, useEffect, useState } from 'react'
import { getTeacherCourses } from '../api/teacher-courses.api'
import {
  cancelTeacherExamSchedule, createTeacherExamSchedule,
  getTeacherExamSchedules, updateTeacherExamSchedule,
} from '../api/teacher-exams.api'
import { toExamSchedule, toTeacherSchedulePayload } from '../mappers/teacher-exam.mapper'
import type { CourseOffering } from '../types/teacher-course.types'
import type { ExamSchedule } from '../types/teacher-exam.types'

export function useTeacherExamSchedules(examId: string, subjectId: string) {
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [courses, setCourses] = useState<CourseOffering[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [scheduleRows, courseData] = await Promise.all([
      getTeacherExamSchedules(examId), getTeacherCourses(),
    ])
    setSchedules(scheduleRows.map(toExamSchedule))
    setCourses(courseData.items.filter(({ subject, status }) => subject.id === subjectId && status === 'ACTIVE').map((row) => ({
      id: row.id, courseCode: row.code, status: row.status,
      semesterId: row.semester.id, semesterCode: row.semester.code, semesterName: row.semester.name,
      semesterStatus: row.semester.status,
      subjectId: row.subject.id, subjectCode: row.subject.code, subjectName: row.subject.name,
      teacherName: '', totalStudents: row.enrollmentCount, totalExams: row.scheduleCount,
    })))
    setLoading(false)
  }, [examId, subjectId])

  useEffect(() => {
    // Synchronize schedule data after the exam or subject selection changes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  const save = async (schedule: ExamSchedule, scheduleId?: string) => {
    const payload = toTeacherSchedulePayload(schedule)
    const row = scheduleId
      ? await updateTeacherExamSchedule(examId, scheduleId, payload)
      : await createTeacherExamSchedule(examId, payload)
    const mapped = toExamSchedule(row)
    setSchedules((current) => scheduleId
      ? current.map((item) => item.id === scheduleId ? mapped : item)
      : [...current, mapped])
    return mapped
  }

  const cancel = async (scheduleId: string, reason: string) => {
    const mapped = toExamSchedule(await cancelTeacherExamSchedule(examId, scheduleId, reason))
    setSchedules((current) => current.map((item) => item.id === scheduleId ? mapped : item))
  }

  return { schedules, courses, loading, save, cancel, retry: load }
}
