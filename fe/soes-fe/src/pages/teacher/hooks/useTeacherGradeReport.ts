import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  getAllTeacherExamSubmissions,
  getTeacherExamSchedules,
  getTeacherExams,
} from '../api/teacher-exams.api'
import { toExam, toExamSchedule } from '../mappers/teacher-exam.mapper'
import type { TeacherExamSubmissionDto } from '../types/teacher-exam-api.types'
import type { Exam, ExamSchedule } from '../types/teacher-exam.types'
import {
  buildGradeRows,
  exportGradeCsv,
  filterGradeRows,
  gradeDistribution,
  gradeStatistics,
} from '../utils/teacher-grade-report.utils'

export function useTeacherGradeReport() {
  const [exams, setExams] = useState<Exam[]>([])
  const [schedules, setSchedules] = useState<ExamSchedule[]>([])
  const [submissions, setSubmissions] = useState<TeacherExamSubmissionDto[]>([])
  const [selectedExamId, setSelectedExamId] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [loadedSubmissionKey, setLoadedSubmissionKey] = useState('')
  const submissionKey = `${selectedExamId}:${selectedScheduleId}`

  useEffect(() => {
    getTeacherExams()
      .then((response) => {
        const mappedExams = response.map(toExam)
        setExams(mappedExams)
        setSelectedExamId(mappedExams[0]?.id ?? '')
      })
      .catch(() => toast.error('Không thể tải danh sách đề thi.'))
  }, [])

  useEffect(() => {
    if (!selectedExamId) return
    let active = true
    getTeacherExamSchedules(selectedExamId)
      .then((response) => {
        if (!active) return
        const mappedSchedules = response.map(toExamSchedule)
        setSchedules(mappedSchedules)
        setSelectedScheduleId(mappedSchedules[0]?.id ?? '')
      })
      .catch(() => toast.error('Không thể tải danh sách ca thi.'))
    return () => { active = false }
  }, [selectedExamId])

  useEffect(() => {
    if (!selectedExamId || !selectedScheduleId) return
    let active = true
    getAllTeacherExamSubmissions(selectedExamId, selectedScheduleId)
      .then((response) => { if (active) setSubmissions(response) })
      .catch(() => { if (active) toast.error('Không thể tải dữ liệu kết quả thi.') })
      .finally(() => { if (active) setLoadedSubmissionKey(submissionKey) })
    return () => { active = false }
  }, [selectedExamId, selectedScheduleId, submissionKey])

  const selectedExam = useMemo(
    () => exams.find((exam) => exam.id === selectedExamId),
    [exams, selectedExamId],
  )
  const selectedSchedule = useMemo(
    () => schedules.find((schedule) => schedule.id === selectedScheduleId),
    [schedules, selectedScheduleId],
  )
  const rows = useMemo(
    () => buildGradeRows(submissions, selectedExam, selectedSchedule),
    [selectedExam, selectedSchedule, submissions],
  )
  const filteredRows = useMemo(
    () => filterGradeRows(rows, searchKeyword),
    [rows, searchKeyword],
  )

  const selectExam = (examId: string) => {
    setSelectedExamId(examId)
    setSchedules([])
    setSelectedScheduleId('')
    setSubmissions([])
  }

  const selectSchedule = (scheduleId: string) => {
    setSelectedScheduleId(scheduleId)
    setSubmissions([])
  }

  return {
    exams,
    schedules,
    selectedExamId,
    selectedScheduleId,
    searchKeyword,
    rows: filteredRows,
    statistics: gradeStatistics(rows),
    chartData: gradeDistribution(rows),
    loading: Boolean(selectedExamId && selectedScheduleId) && loadedSubmissionKey !== submissionKey,
    selectExam,
    selectSchedule,
    setSearchKeyword,
    exportCsv: () => exportGradeCsv(filteredRows, selectedExam?.title ?? ''),
  }
}
