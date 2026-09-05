import { useCallback, useEffect, useState } from 'react'
import {
  getTeacherExamSubmissions, getTeacherExamViolations, getTeacherProctoringSessions, gradeTeacherExamSubmission, updateTeacherResultRelease,
} from '../api/teacher-exams.api'
import type { ExamSubmission, ProctoringSessionRecord, ResultReleaseMode, ViolationRecord } from '../types/teacher-exam.types'

const emptyPagination = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

export function useTeacherExamSubmissions(examId: string, scheduleId: string) {
  const [items, setItems] = useState<ExamSubmission[]>([])
  const [pagination, setPagination] = useState(emptyPagination)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [violations, setViolations] = useState<ViolationRecord[]>([])
  const [proctoringSessions, setProctoringSessions] = useState<ProctoringSessionRecord[]>([])
  const [resultRelease, setResultRelease] = useState<{
    mode: ResultReleaseMode; releaseAt: string; published: boolean
  }>({ mode: 'MANUAL', releaseAt: '', published: false })

  const load = useCallback(async () => {
    if (!scheduleId) { setItems([]); return }
    setLoading(true)
    try {
      const [data, violationItems, proctoringSessionItems] = await Promise.all([
        getTeacherExamSubmissions(examId, scheduleId, page),
        getTeacherExamViolations(examId, scheduleId),
        getTeacherProctoringSessions(examId, scheduleId),
      ])
      setItems(data.items.map((item) => ({
        ...item,
        submittedAt: item.submittedAt
          ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(item.submittedAt))
          : '-',
        manualScoreOverride: item.manualScoreOverride,
        answers: item.answers.map((answer) => ({
          questionId: answer.questionId, selectedOptionIds: answer.selectedOptionIds,
          sourceCode: answer.sourceCode ?? undefined, score: answer.score,
        })),
        codingResults: item.codingResults.map((result) => ({
          ...result,
          actualOutput: result.actualOutput ?? '',
        })),
      })))
      setPagination(data.pagination)
      setViolations(violationItems)
      setProctoringSessions(proctoringSessionItems)
      setResultRelease({
        mode: data.resultRelease.mode, releaseAt: data.resultRelease.releaseAt ?? '',
        published: data.resultRelease.published,
      })
    } finally { setLoading(false) }
  }, [examId, page, scheduleId])

  useEffect(() => { void load() }, [load])
  useEffect(() => { setPage(1) }, [scheduleId])

  return {
    items, violations, proctoringSessions, pagination, page, loading, resultRelease, setPage,
    grade: async (attemptId: string, score: number, reason: string) => {
      await gradeTeacherExamSubmission(examId, scheduleId, attemptId, score, reason)
      await load()
    },
    release: async (next: typeof resultRelease) => {
      await updateTeacherResultRelease(examId, scheduleId, {
        mode: next.mode, releaseAt: next.releaseAt || null, published: next.published,
      })
      await load()
    },
  }
}
