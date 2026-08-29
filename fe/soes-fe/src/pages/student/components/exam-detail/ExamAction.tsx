import { AxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { takeExamApi } from '../../api/student-take-exam.api'
import { useExamWebcam } from '../../hooks/take-exam/useExamWebcam'
import type { ExamDetail } from '../../types/exam-detail.types'
import { hasActiveExamWebcam } from '../../utils/exam-webcam'
import WebcamCheckDialog from './WebcamCheckDialog'

interface ExamActionProps {
  data: ExamDetail
}

export default function ExamAction({ data }: ExamActionProps) {
  const { courseOfferingId, examId } = useParams<{ courseOfferingId: string; examId: string }>()
  const navigate = useNavigate()
  const { canStart, canResume, status, attemptId: existingAttemptId } = data
  const [isStarting, setIsStarting] = useState(false)
  const [isWebcamDialogOpen, setIsWebcamDialogOpen] = useState(false)
  const webcam = useExamWebcam(data.enableWebcam)

  if (status === 'SUBMITTED') {
    return (
      <button disabled className="w-full cursor-not-allowed rounded-xl bg-gray-100 px-6 py-2.5 text-xs font-medium text-gray-400 sm:w-auto">
        Đã nộp bài
      </button>
    )
  }

  if (status === 'EXPIRED') {
    return (
      <button disabled className="w-full cursor-not-allowed rounded-xl bg-gray-100 px-6 py-2.5 text-xs font-medium text-gray-400 sm:w-auto">
        Đã hết hạn
      </button>
    )
  }

  if (!canStart) {
    return (
      <button disabled className="w-full cursor-not-allowed rounded-xl bg-gray-100 px-6 py-2.5 text-xs font-medium text-gray-400 sm:w-auto">
        Vào làm bài
      </button>
    )
  }

  const navigateToExam = (targetExamId: string, attemptId: string) => {
    navigate(`/student/course-offerings/${courseOfferingId ?? ''}/exams/${targetExamId}/take`, {
      state: { attemptId },
    })
  }

  const startOrResumeExam = async () => {
    const targetExamId = examId ?? data.id

    if (data.enableWebcam && !hasActiveExamWebcam()) {
      toast.error('Camera chưa sẵn sàng', {
        description: 'Bạn phải bật camera trước khi vào làm bài.',
      })
      return
    }

    if (canResume && existingAttemptId) {
      navigateToExam(targetExamId, existingAttemptId)
      return
    }

    try {
      setIsStarting(true)
      const result = await takeExamApi.startExam(targetExamId, {
        webcamConfirmed: data.enableWebcam ? hasActiveExamWebcam() : undefined,
      })
      navigateToExam(targetExamId, result.attemptId)
    } catch (error: unknown) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message
        : null
      toast.error(message || 'Không thể bắt đầu bài thi')
    } finally {
      setIsStarting(false)
    }
  }

  const handleStartExam = () => {
    if (data.enableWebcam) {
      setIsWebcamDialogOpen(true)
      return
    }
    void startOrResumeExam()
  }

  const handleCloseWebcamDialog = () => {
    if (isStarting) return
    webcam.stop()
    setIsWebcamDialogOpen(false)
  }

  const handleEnableCamera = () => {
    void webcam.start().catch(() => undefined)
  }

  const label = canResume ? 'Tiếp tục làm bài' : 'Vào làm bài'

  return (
    <>
      <button
        type="button"
        disabled={isStarting}
        onClick={handleStartExam}
        className="w-full rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
      >
        {isStarting ? 'Đang xử lý...' : label}
      </button>

      <WebcamCheckDialog
        isOpen={isWebcamDialogOpen}
        stream={webcam.stream}
        status={webcam.status}
        errorMessage={webcam.errorMessage}
        isStartingExam={isStarting}
        onEnableCamera={handleEnableCamera}
        onClose={handleCloseWebcamDialog}
        onContinue={() => void startOrResumeExam()}
      />
    </>
  )
}
