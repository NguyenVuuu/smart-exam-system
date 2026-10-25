import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/teacher-approvals.api'
import { toExam } from '../mappers/teacher-exam.mapper'
import { toQuestion } from '../mappers/teacher-question.mapper'
import { getSocket } from '../../../api/socket'
import type { Exam } from '../types/teacher-exam.types'
import type { Question } from '../types/teacher-question-bank.types'

export function useTeacherApprovals(questionsEnabled: boolean, examsEnabled: boolean) {
  const [questions, setQuestions] = useState<Array<{ itemId: string; question: Question }>>([])
  const [exams, setExams] = useState<Array<Exam & { reviewRound: api.ExamApprovalDto['reviewRound'] }>>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!questionsEnabled && !examsEnabled) {
      setQuestions([])
      setExams([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [questionResult, examResult] = await Promise.allSettled([
        questionsEnabled ? api.getPendingQuestionApprovals() : Promise.resolve([]),
        examsEnabled ? api.getPendingExamApprovals() : Promise.resolve([]),
      ])
      setQuestions(questionResult.status === 'fulfilled'
        ? questionResult.value.map((row) => ({ itemId: row.id, question: toQuestion(row.question) })) : [])
      setExams(examResult.status === 'fulfilled'
        ? examResult.value.map((row) => ({ ...toExam(row), reviewRound: row.reviewRound })) : [])
      if (questionResult.status === 'rejected' || examResult.status === 'rejected') {
        setError('Không thể tải một phần hàng đợi duyệt chuyên môn.')
      }
    } catch { setError('Không thể tải hàng đợi duyệt chuyên môn.') }
    finally { setLoading(false) }
  }, [questionsEnabled, examsEnabled])

  useEffect(() => { void Promise.resolve().then(load) }, [load])
  useEffect(() => {
    const socket = getSocket()
    const refreshQueue = (notification: { link?: string | null }) => {
      if (notification.link === '/teacher/department-approvals'
        || notification.link?.startsWith('/teacher/exams/')) void load()
    }
    socket.on('notification:created', refreshQueue)
    return () => { socket.off('notification:created', refreshQueue) }
  }, [load])

  const mutate = async (action: () => Promise<unknown>) => { await action(); await load() }
  return {
    questions, exams, loading, error, retry: load,
    approveQuestion: (id: string) => mutate(() => api.approveQuestion(id)),
    rejectQuestion: (id: string, reason: string) => mutate(() => api.rejectQuestion(id, reason)),
    approveExam: (id: string) => mutate(() => api.approveExam(id)),
    rejectExam: (id: string, reason: string, questionNotes: api.ExamQuestionRevisionNote[]) =>
      mutate(() => api.rejectExam(id, reason, questionNotes)),
  }
}
