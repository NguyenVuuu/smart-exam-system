import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { takeExamApi } from '../../api/student-take-exam.api'
import type { ExamDetail } from '../../types/exam-detail.types'

interface ExamActionProps {
  data: ExamDetail
}

export default function ExamAction({ data }: ExamActionProps) {
  const { courseOfferingId, examId } = useParams<{ courseOfferingId: string; examId: string }>()
  const navigate = useNavigate()
  const { canStart, canResume, status, attemptId: existingAttemptId } = data
  const [isStarting, setIsStarting] = useState(false)

  if (status === 'SUBMITTED') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-2.5 text-xs font-medium bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
      >
        Đã nộp bài
      </button>
    )
  }

  if (status === 'EXPIRED') {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-2.5 text-xs font-medium bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
      >
        Đã hết hạn
      </button>
    )
  }

  if (!canStart) {
    return (
      <button
        disabled
        className="w-full sm:w-auto px-6 py-2.5 text-xs font-medium bg-gray-100 text-gray-400 rounded-xl cursor-not-allowed"
      >
        Vào làm bài
      </button>
    )
  }

  const handleStartExam = async () => {
    const targetExamId = examId ?? data.id
    if (canResume && existingAttemptId) {
      navigate(`/student/course-offerings/${courseOfferingId ?? ''}/exams/${targetExamId}/take`, {
        state: { attemptId: existingAttemptId },
      })
      return
    }

    try {
      setIsStarting(true)
      const res = await takeExamApi.startExam(targetExamId)
      navigate(`/student/course-offerings/${courseOfferingId ?? ''}/exams/${targetExamId}/take`, {
        state: { attemptId: res.attemptId },
      })
    } catch (error: any) {
      console.error(error)
      toast.error(error.response?.data?.message || 'Không thể bắt đầu bài thi')
    } finally {
      setIsStarting(false)
    }
  }

  const label = canResume ? 'Tiếp tục làm bài' : 'Vào làm bài'

  return (
    <button
      type="button"
      disabled={isStarting}
      onClick={handleStartExam}
      className="w-full sm:w-auto px-6 py-2.5 text-xs font-semibold bg-blue-600 text-white rounded-xl shadow-sm shadow-blue-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isStarting ? 'Đang xử lý...' : label}
    </button>
  )
}
