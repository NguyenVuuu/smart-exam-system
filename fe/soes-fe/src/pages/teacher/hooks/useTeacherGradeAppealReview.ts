import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  getAllTeacherExamSubmissions,
  getTeacherExam,
  getTeacherGradeAppeal,
  gradeTeacherExamSubmission,
  type TeacherGradeAppeal,
} from '../api/teacher-exams.api'
import { toExamDetail, toExamSubmission } from '../mappers/teacher-exam.mapper'
import type { Exam, ExamSubmission } from '../types/teacher-exam.types'

export function useTeacherGradeAppealReview(appealId: string) {
  const [appeal, setAppeal] = useState<TeacherGradeAppeal | null>(null)
  const [exam, setExam] = useState<Exam | null>(null)
  const [submission, setSubmission] = useState<ExamSubmission | null>(null)
  const [score, setScore] = useState(0)
  const [conclusion, setConclusion] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    getTeacherGradeAppeal(appealId)
      .then(async (appealResponse) => {
        const [examResponse, submissions] = await Promise.all([
          getTeacherExam(appealResponse.exam.examId),
          getAllTeacherExamSubmissions(appealResponse.exam.examId, appealResponse.exam.scheduleId),
        ])
        if (!active) return
        const matchedSubmission = submissions.find((entry) => entry.attemptId === appealResponse.attemptId)
        if (!matchedSubmission) throw new Error('Submission not found')
        const mappedSubmission = toExamSubmission(matchedSubmission)
        setAppeal(appealResponse)
        setExam(toExamDetail(examResponse))
        setSubmission(mappedSubmission)
        setScore(mappedSubmission.manualScoreOverride ?? mappedSubmission.finalScore ?? mappedSubmission.autoScore ?? 0)
        setConclusion(appealResponse.teacherReply ?? '')
      })
      .catch(() => {
        if (active) setError('Không thể tải bài nộp cần phúc khảo.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [appealId])

  const save = async () => {
    if (!appeal || !submission) return
    if (score < 0 || score > appeal.exam.maxScore) {
      toast.warning(`Điểm phúc khảo phải từ 0 đến ${appeal.exam.maxScore}.`)
      return
    }
    if (conclusion.trim().length < 5) {
      toast.warning('Vui lòng nhập kết luận chấm lại rõ ràng.')
      return
    }
    setSaving(true)
    try {
      await gradeTeacherExamSubmission(
        appeal.exam.examId,
        appeal.exam.scheduleId,
        appeal.attemptId,
        score,
        conclusion.trim(),
      )
      setAppeal((current) => current ? {
        ...current,
        status: 'RESOLVED',
        teacherReply: conclusion.trim(),
        handledAt: new Date().toISOString(),
        exam: { ...current.exam, score },
      } : current)
      setSubmission((current) => current ? {
        ...current,
        manualScoreOverride: score,
        finalScore: score,
      } : current)
      toast.success('Đã lưu kết quả phúc khảo.')
    } catch {
      toast.error('Không thể lưu kết quả phúc khảo.')
    } finally {
      setSaving(false)
    }
  }

  return {
    appeal, exam, submission, score, conclusion, loading, saving, error,
    setScore, setConclusion, save,
  }
}
