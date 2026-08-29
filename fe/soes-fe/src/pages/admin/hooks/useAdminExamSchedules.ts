import { useCallback, useEffect, useState } from 'react'
import { cancelExamSchedule, createExamSchedule, getScheduleWorkspace, updateExamSchedule, type ScheduleListParams } from '../api/admin-exam-schedules.api'
import type { ApiPagination } from '../types/admin-api.types'
import {
  currentSemesterCode, toAdminExam, toAdminSchedule, toCourse, toDepartment,
  toSchedulePayload, toSubject, toTeacher,
} from '../mappers/admin-exam-schedule.mapper'
import type { AdminExam, AdminExamSchedule, AdminSubject, AdminUser, CourseOfferingAdmin, Department } from '../types/admin.types'

interface State {
  schedules: AdminExamSchedule[]; exams: AdminExam[]; departments: Department[]
  subjects: AdminSubject[]; courses: CourseOfferingAdmin[]; teachers: AdminUser[]
  loading: boolean; error: string | null
  pagination: ApiPagination
}

const initialState: State = {
  schedules: [], exams: [], departments: [], subjects: [], courses: [], teachers: [],
  loading: true, error: null,
  pagination: { page: 1, pageSize: 5, totalItems: 0, totalPages: 1 },
}

export function useAdminExamSchedules(params: ScheduleListParams) {
  const [state, setState] = useState(initialState)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let active = true
    getScheduleWorkspace(params).then((data) => {
      if (!active) return
      const semesterCode = currentSemesterCode(data.semesters)
      setState({
        schedules: data.schedules.map(toAdminSchedule),
        exams: data.exams.map((exam) => toAdminExam(exam, semesterCode)),
        departments: data.departments.map(toDepartment), subjects: data.subjects.map(toSubject),
        courses: data.courses.map(toCourse), teachers: data.teachers.map(toTeacher),
        pagination: data.pagination,
        loading: false, error: null,
      })
    }).catch(() => active && setState((current) => ({
      ...current, loading: false, error: 'Không thể tải dữ liệu lịch thi.',
    })))
    return () => { active = false }
  }, [params.page, params.pageSize, params.keyword, params.semesterId, params.departmentId, params.subjectId, params.status, version])

  const save = useCallback(async (schedule: AdminExamSchedule) => {
    const existing = state.schedules.some(({ id }) => id === schedule.id)
    const row = existing
      ? await updateExamSchedule(schedule.id, toSchedulePayload(schedule, true))
      : await createExamSchedule(toSchedulePayload(schedule, false))
    const mapped = toAdminSchedule(row)
    setState((current) => ({
      ...current,
      schedules: existing
        ? current.schedules.map((item) => item.id === mapped.id ? mapped : item)
        : [mapped, ...current.schedules],
    }))
  }, [state.schedules])

  const cancel = useCallback(async (id: string, reason: string) => {
    const mapped = toAdminSchedule(await cancelExamSchedule(id, reason))
    setState((current) => ({
      ...current, schedules: current.schedules.map((item) => item.id === id ? mapped : item),
    }))
  }, [])

  const retry = () => {
    setState((current) => ({ ...current, loading: true, error: null }))
    setVersion((value) => value + 1)
  }
  return { ...state, save, cancel, retry }
}
