import { isAxiosError } from 'axios'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getSocket } from '../../../api/socket'
import { takeExamApi, type GradeAppeal } from '../api/student-take-exam.api'

type GradeAppealUpdate = Partial<GradeAppeal> & {
  attemptId: string
  status: GradeAppeal['status']
}

export function useStudentGradeAppeals(scheduleId?: string, attemptId?: string) {
  const [appeals, setAppeals] = useState<GradeAppeal[]>([])
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submittingRef = useRef(false)

  const loadAppeals = useCallback(async () => {
    if (!scheduleId || !attemptId) return
    const items = await takeExamApi.listGradeAppeals(scheduleId, attemptId)
    setAppeals(items)
  }, [attemptId, scheduleId])

  useEffect(() => {
    if (!scheduleId || !attemptId) return

    let active = true
    loadAppeals()
      .catch(() => { if (active) toast.error('Không thể tải trạng thái phúc khảo.') })

    const socket = getSocket()
    const applyAppealUpdate = (update: GradeAppealUpdate) => {
      if (update.attemptId !== attemptId) return
      setAppeals((current) => current.map((appeal, index) => {
        const matches = update.id ? appeal.id === update.id : index === 0
        return matches ? { ...appeal, ...update } : appeal
      }))
    }
    socket.on('grade_appeal:updated', applyAppealUpdate)

    return () => {
      active = false
      socket.off('grade_appeal:updated', applyAppealUpdate)
    }
  }, [attemptId, loadAppeals, scheduleId])

  const hasAnyAppeal = appeals.length > 0
  const hasOpenAppeal = useMemo(
    () => appeals.some(({ status }) => status === 'PENDING' || status === 'IN_REVIEW'),
    [appeals],
  )

  const submit = async () => {
    if (submittingRef.current) return
    if (hasAnyAppeal) {
      toast.warning('Mỗi bài thi chỉ được gửi phúc khảo một lần.')
      return
    }
    if (!scheduleId || !attemptId || reason.trim().length < 10) {
      toast.warning('Vui lòng nhập lý do phúc khảo rõ hơn.')
      return
    }

    submittingRef.current = true
    setIsSubmitting(true)
    try {
      const created = await takeExamApi.createGradeAppeal(scheduleId, attemptId, { reason: reason.trim() })
      setAppeals((current) => [created, ...current])
      setReason('')
      toast.success('Đã gửi yêu cầu phúc khảo.')
    } catch (error) {
      if (isAxiosError(error) && error.response?.status === 409) {
        await loadAppeals().catch(() => undefined)
        toast.info('Yêu cầu phúc khảo của bài thi này đã được ghi nhận.')
      } else {
        toast.error('Không thể gửi phúc khảo. Vui lòng thử lại.')
      }
    } finally {
      submittingRef.current = false
      setIsSubmitting(false)
    }
  }

  return {
    appeals,
    reason,
    setReason,
    isSubmitting,
    hasAnyAppeal,
    hasOpenAppeal,
    submit,
  }
}
