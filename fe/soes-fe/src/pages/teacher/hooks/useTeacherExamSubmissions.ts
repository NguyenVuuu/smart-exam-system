import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  finalizeTeacherSubmissionScore,
  finalizeTeacherSubmissionScores,
  getAllTeacherExamSubmissions,
  getTeacherExamSubmissions,
  markTeacherSubmissionViolationsViewed,
  updateTeacherResultRelease,
} from '../api/teacher-exams.api'
import { toExamSubmission } from '../mappers/teacher-exam.mapper'
import type { ExamSubmission, ResultReleaseMode } from '../types/teacher-exam.types'

const EMPTY_PAGINATION = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

function formatSubmissionDate(value: string | null) {
  return value
    ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value))
    : '-'
}

export function useTeacherExamSubmissions(examId: string, scheduleId: string) {
  const [items, setItems] = useState<ExamSubmission[]>([])
  const [pagination, setPagination] = useState(EMPTY_PAGINATION)
  const [pageSelection, setPageSelection] = useState({ scheduleId, page: 1 })
  const [loadedRequestKey, setLoadedRequestKey] = useState('')
  const [resultRelease, setResultRelease] = useState<{
    mode: ResultReleaseMode
    releaseAt: string
    published: boolean
  }>({ mode: 'MANUAL', releaseAt: '', published: false })
  const [pendingFinalizeCount, setPendingFinalizeCount] = useState(0)
  const page = pageSelection.scheduleId === scheduleId ? pageSelection.page : 1
  const requestKey = `${examId}:${scheduleId}:${page}`

  const applyResponse = useCallback((response: Awaited<ReturnType<typeof getTeacherExamSubmissions>>) => {
    setItems(response.items.map((submission) => ({
      ...toExamSubmission(submission),
      submittedAt: formatSubmissionDate(submission.submittedAt),
    })))
    setPagination(response.pagination)
    setResultRelease({
      mode: response.resultRelease.mode,
      releaseAt: response.resultRelease.releaseAt ?? '',
      published: response.resultRelease.published,
    })
  }, [])

  const refreshPendingFinalizeCount = useCallback(async () => {
    if (!scheduleId) {
      setPendingFinalizeCount(0)
      return
    }
    const allSubmissions = (await getAllTeacherExamSubmissions(examId, scheduleId)).map(toExamSubmission)
    setPendingFinalizeCount(allSubmissions.filter((submission) => submission.status !== 'PUBLISHED').length)
  }, [examId, scheduleId])

  const reload = useCallback(async () => {
    if (!scheduleId) return
    setLoadedRequestKey('')
    const response = await getTeacherExamSubmissions(examId, scheduleId, page)
    applyResponse(response)
    await refreshPendingFinalizeCount()
    setLoadedRequestKey(requestKey)
  }, [applyResponse, examId, page, refreshPendingFinalizeCount, requestKey, scheduleId])

  useEffect(() => {
    if (!scheduleId) return
    let active = true
    getTeacherExamSubmissions(examId, scheduleId, page)
      .then((response) => {
        if (!active) return
        applyResponse(response)
        void refreshPendingFinalizeCount()
      })
      .catch(() => {
        if (active) toast.error('Không thể tải danh sách bài nộp.')
      })
      .finally(() => {
        if (active) setLoadedRequestKey(requestKey)
      })
    return () => { active = false }
  }, [applyResponse, examId, page, refreshPendingFinalizeCount, requestKey, scheduleId])

  const setPage = (nextPage: number) => {
    setPageSelection({ scheduleId, page: nextPage })
  }

  const release = async (next: typeof resultRelease) => {
    await updateTeacherResultRelease(examId, scheduleId, {
      mode: next.mode,
      releaseAt: next.releaseAt || null,
      published: next.published,
    })
    setResultRelease(next)
  }

  const markViolationsViewed = async (attemptId: string) => {
    await markTeacherSubmissionViolationsViewed(examId, scheduleId, attemptId)
    await reload()
  }

  const finalizeOne = async (attemptId: string, score: number) => {
    await finalizeTeacherSubmissionScore(examId, scheduleId, attemptId, score)
    await reload()
  }

  const finalizeMany = async (scoreOverrides: Array<{ attemptId: string; score: number }>) => {
    const overrideMap = new Map(scoreOverrides.map((item) => [item.attemptId, item.score]))
    const allSubmissions = (await getAllTeacherExamSubmissions(examId, scheduleId)).map(toExamSubmission)
    const readyToFinalize = allSubmissions.filter((submission) => submission.status !== 'PUBLISHED')
    const blockedCount = readyToFinalize.filter((submission) => submission.violationCount > 0 && !submission.violationsViewed).length
    if (blockedCount > 0) {
      throw Object.assign(new Error('VIOLATIONS_NOT_VIEWED'), { blockedCount })
    }
    const itemsToFinalize = readyToFinalize.map((submission) => ({
      attemptId: submission.attemptId,
      score: overrideMap.get(submission.attemptId) ?? submission.finalScore ?? submission.autoScore ?? 0,
    }))
    if (!itemsToFinalize.length) return 0
    await finalizeTeacherSubmissionScores(examId, scheduleId, itemsToFinalize)
    await reload()
    return itemsToFinalize.length
  }

  return {
    items: scheduleId ? items : [],
    pagination: scheduleId ? pagination : EMPTY_PAGINATION,
    page,
    loading: Boolean(scheduleId) && loadedRequestKey !== requestKey,
    resultRelease,
    pendingFinalizeCount,
    setPage,
    release,
    reload,
    markViolationsViewed,
    finalizeOne,
    finalizeMany,
  }
}
