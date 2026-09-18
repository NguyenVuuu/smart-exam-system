import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getSocket } from '../../../api/socket'
import {
  getTeacherExam,
  getAllTeacherExamSubmissions,
  getTeacherGradeAppeals,
  gradeTeacherExamSubmission,
  updateTeacherGradeAppeal,
  type TeacherGradeAppeal,
  type TeacherPaginationMeta,
} from '../api/teacher-exams.api'
import { toExamDetail } from '../mappers/teacher-exam.mapper'
import type { TeacherExamSubmissionDto } from '../types/teacher-exam-api.types'
import type { Exam, ExamSubmission } from '../types/teacher-exam.types'

export type GradeAppealStatus = TeacherGradeAppeal['status'] | 'ALL'

const EMPTY_PAGINATION: TeacherPaginationMeta = {
  page: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 1,
}

function examSubmission(dto: TeacherExamSubmissionDto): ExamSubmission {
  return {
    ...dto,
    submittedAt: dto.submittedAt ?? '',
    answers: dto.answers.map((answer) => ({ ...answer, sourceCode: answer.sourceCode ?? undefined })),
    codingResults: dto.codingResults.map((record) => ({ ...record, actualOutput: record.actualOutput ?? '' })),
  }
}

function isOpenAppeal(appeal: TeacherGradeAppeal) {
  return appeal.status === 'PENDING' || appeal.status === 'IN_REVIEW'
}

export function useTeacherGradeAppeals() {
  const [appeals, setAppeals] = useState<TeacherGradeAppeal[]>([])
  const [pagination, setPagination] = useState(EMPTY_PAGINATION)
  const [status, setStatus] = useState<GradeAppealStatus>('ALL')
  const [replies, setReplies] = useState<Record<string, string>>({})
  const [selectedAppeal, setSelectedAppeal] = useState<TeacherGradeAppeal | null>(null)
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null)
  const [score, setScore] = useState(0)
  const [reason, setReason] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)
  const [loadedQueryKey, setLoadedQueryKey] = useState('')
  const [loadingSubmission, setLoadingSubmission] = useState(false)
  const [savingScore, setSavingScore] = useState(false)

  const queryKey = `${status}:${pagination.page}:${refreshVersion}`

  useEffect(() => {
    let active = true
    getTeacherGradeAppeals({ status, page: pagination.page, pageSize: 10 })
      .then((response) => {
        if (!active) return
        setAppeals(response.items)
        setPagination(response.pagination)
        setLoadedQueryKey(queryKey)
      })
      .catch(() => {
        if (!active) return
        setLoadedQueryKey(queryKey)
        toast.error('Không thể tải danh sách phúc khảo.')
      })
    return () => { active = false }
  }, [pagination.page, queryKey, status])

  useEffect(() => {
    const socket = getSocket()
    const refreshAppeals = () => {
      setPagination((current) => ({ ...current, page: 1 }))
      setRefreshVersion((current) => current + 1)
    }
    socket.on('grade_appeal:created', refreshAppeals)
    return () => { socket.off('grade_appeal:created', refreshAppeals) }
  }, [])

  const changeStatus = (nextStatus: GradeAppealStatus) => {
    setStatus(nextStatus)
    setPagination((current) => ({ ...current, page: 1 }))
  }

  const updateReply = (appealId: string, reply: string) => {
    setReplies((current) => ({ ...current, [appealId]: reply }))
  }

  const updateAppeal = async (appealId: string, nextStatus: 'IN_REVIEW' | 'REJECTED') => {
    try {
      const updated = await updateTeacherGradeAppeal(appealId, {
        status: nextStatus,
        teacherReply: replies[appealId]?.trim() || undefined,
      })
      setAppeals((current) => current.map((appeal) => appeal.id === appealId ? updated : appeal))
      setRefreshVersion((current) => current + 1)
      toast.success('Đã cập nhật yêu cầu phúc khảo.')
    } catch {
      toast.error('Không thể cập nhật yêu cầu phúc khảo.')
    }
  }

  const openSubmission = async (appeal: TeacherGradeAppeal) => {
    setSelectedAppeal(appeal)
    setLoadingSubmission(true)
    try {
      const [examDetail, submissions] = await Promise.all([
        getTeacherExam(appeal.exam.examId),
        getAllTeacherExamSubmissions(appeal.exam.examId, appeal.exam.scheduleId),
      ])
      const matchedSubmission = submissions.find((entry) => entry.attemptId === appeal.attemptId)
      if (!matchedSubmission) {
        toast.error('Không tìm thấy bài nộp tương ứng với yêu cầu phúc khảo.')
        return
      }
      const mappedSubmission = examSubmission(matchedSubmission)
      setSelectedExam(toExamDetail(examDetail))
      setSelectedSubmission(mappedSubmission)
      setScore(mappedSubmission.manualScoreOverride ?? mappedSubmission.finalScore ?? mappedSubmission.autoScore ?? 0)
      setReason(mappedSubmission.overrideReason ?? appeal.teacherReply ?? appeal.reason)
    } catch {
      toast.error('Không thể tải bài nộp để chấm lại.')
    } finally {
      setLoadingSubmission(false)
    }
  }

  const closeSubmission = () => {
    setSelectedAppeal(null)
    setSelectedExam(null)
    setSelectedSubmission(null)
  }

  const saveScore = async () => {
    if (!selectedAppeal || !selectedSubmission || !isOpenAppeal(selectedAppeal)) return
    if (score < 0 || score > selectedAppeal.exam.maxScore || reason.trim().length < 5) {
      toast.warning('Vui lòng nhập điểm hợp lệ và lý do điều chỉnh rõ hơn.')
      return
    }
    setSavingScore(true)
    try {
      await gradeTeacherExamSubmission(
        selectedAppeal.exam.examId,
        selectedAppeal.exam.scheduleId,
        selectedAppeal.attemptId,
        score,
        reason.trim(),
      )
      toast.success('Đã lưu điểm phúc khảo cho bài nộp.')
      closeSubmission()
      setRefreshVersion((current) => current + 1)
    } catch {
      toast.error('Không thể lưu điểm phúc khảo.')
    } finally {
      setSavingScore(false)
    }
  }

  return {
    appeals, pagination, status, replies, selectedAppeal, selectedExam, selectedSubmission,
    score, reason, loading: loadedQueryKey !== queryKey, loadingSubmission, savingScore,
    setPage: (page: number) => setPagination((current) => ({ ...current, page })),
    changeStatus, updateReply, updateAppeal, openSubmission, closeSubmission,
    setScore, setReason, saveScore,
  }
}
