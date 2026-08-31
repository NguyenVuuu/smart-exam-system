import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/teacher-approvals.api'
import { toExam } from '../mappers/teacher-exam.mapper'
import { toQuestion } from '../mappers/teacher-question.mapper'
import type { Exam } from '../types/teacher-exam.types'
import type { Question } from '../types/teacher-question-bank.types'

export function useTeacherApprovals(enabled: boolean) {
  const [questions, setQuestions] = useState<Array<{ itemId: string; question: Question }>>([])
  const [exams, setExams] = useState<Exam[]>([])
  const [loading, setLoading] = useState(enabled)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!enabled) return
    setLoading(true)
    setError(null)
    try {
      const [questionRows, examRows] = await Promise.all([
        api.getPendingQuestionApprovals(), api.getPendingExamApprovals(),
      ])
      setQuestions(questionRows.map((row) => ({ itemId: row.id, question: toQuestion(row.question) })))
      setExams(examRows.map(toExam))
    } catch { setError('Không thể tải hàng đợi duyệt chuyên môn.') }
    finally { setLoading(false) }
  }, [enabled])

  useEffect(() => { void Promise.resolve().then(load) }, [load])

  const mutate = async (action: () => Promise<unknown>) => { await action(); await load() }
  return {
    questions, exams, loading, error, retry: load,
    approveQuestion: (id: string) => mutate(() => api.approveQuestion(id)),
    rejectQuestion: (id: string, reason: string) => mutate(() => api.rejectQuestion(id, reason)),
    approveExam: (id: string) => mutate(() => api.approveExam(id)),
    rejectExam: (id: string, reason: string) => mutate(() => api.rejectExam(id, reason)),
  }
}
