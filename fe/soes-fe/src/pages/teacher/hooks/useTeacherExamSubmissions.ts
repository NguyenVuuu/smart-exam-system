import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getTeacherExamSubmissions, updateTeacherResultRelease } from '../api/teacher-exams.api'
import type { TeacherExamSubmissionDto } from '../types/teacher-exam-api.types'
import type { ExamSubmission, ResultReleaseMode } from '../types/teacher-exam.types'

const EMPTY_PAGINATION = { page: 1, pageSize: 10, totalItems: 0, totalPages: 1 }

function submissionFrom(dto: TeacherExamSubmissionDto): ExamSubmission {
  return {
    ...dto,
    submittedAt: dto.submittedAt
      ? new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(dto.submittedAt))
      : '-',
    answers: dto.answers.map((answer) => ({ ...answer, sourceCode: answer.sourceCode ?? undefined })),
    codingResults: dto.codingResults.map((record) => ({ ...record, actualOutput: record.actualOutput ?? '' })),
  }
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
  const page = pageSelection.scheduleId === scheduleId ? pageSelection.page : 1
  const requestKey = `${examId}:${scheduleId}:${page}`

  useEffect(() => {
    if (!scheduleId) return
    let active = true
    getTeacherExamSubmissions(examId, scheduleId, page)
      .then((response) => {
        if (!active) return
        setItems(response.items.map(submissionFrom))
        setPagination(response.pagination)
        setResultRelease({
          mode: response.resultRelease.mode,
          releaseAt: response.resultRelease.releaseAt ?? '',
          published: response.resultRelease.published,
        })
      })
      .catch(() => { if (active) toast.error('Không thể tải danh sách bài nộp.') })
      .finally(() => { if (active) setLoadedRequestKey(requestKey) })
    return () => { active = false }
  }, [examId, page, requestKey, scheduleId])

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

  return {
    items: scheduleId ? items : [],
    pagination: scheduleId ? pagination : EMPTY_PAGINATION,
    page,
    loading: Boolean(scheduleId) && loadedRequestKey !== requestKey,
    resultRelease,
    setPage,
    release,
  }
}
