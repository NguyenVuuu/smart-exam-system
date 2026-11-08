import { AxiosError } from 'axios'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { takeExamApi } from '../../api/student-take-exam.api'
import { studentFaceApi } from '../../api/student-face.api'
import FaceVerification from '../face/FaceVerification'
import { isExamScreenShareStreamLive, useExamScreenShare } from '../../hooks/take-exam/useExamScreenShare'
import { useExamWebcam } from '../../hooks/take-exam/useExamWebcam'
import type { ExamDetail } from '../../types/exam-detail.types'
import { hasActiveExamWebcam, isExamWebcamStreamLive } from '../../utils/exam-webcam'
import WebcamCheckDialog from './WebcamCheckDialog'

interface ExamActionProps {
  data: ExamDetail
}

export default function ExamAction({ data }: ExamActionProps) {
  const { courseOfferingId, scheduleId } = useParams<{ courseOfferingId: string; scheduleId: string }>()
  const navigate = useNavigate()
  const { canStart, canResume, status } = data
  const [isStarting, setIsStarting] = useState(false)
  const [isCheckingFace, setIsCheckingFace] = useState(false)
  const [isFaceDialogOpen, setIsFaceDialogOpen] = useState(false)
  const [isWebcamDialogOpen, setIsWebcamDialogOpen] = useState(false)
  const [faceGrantId, setFaceGrantId] = useState<string | undefined>()
  const [password, setPassword] = useState('')
  const webcam = useExamWebcam(data.enableWebcam)
  const screenShare = useExamScreenShare(data.enableScreenMonitoring)

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

  const navigateToExam = (targetScheduleId: string, attemptId: string, faceVerificationId?: string) => {
    navigate(`/student/course-offerings/${courseOfferingId ?? ''}/exam-schedules/${targetScheduleId}/take`, {
      state: { attemptId, faceVerificationId },
    })
  }

  const startOrResumeExam = async (faceVerificationId?: string) => {
    const targetScheduleId = scheduleId ?? data.id
    const hasValidWebcam = hasActiveExamWebcam() && isExamWebcamStreamLive(webcam.stream)
    const hasValidScreenShare = isExamScreenShareStreamLive(screenShare.stream)
    const hasValidFullscreen = !data.requireFullscreen || Boolean(document.fullscreenElement)

    if (data.enableWebcam && !hasValidWebcam) {
      toast.error('Camera chưa sẵn sàng', {
        description: 'Bạn phải bật camera trước khi vào làm bài.',
      })
      return
    }
    if (data.enableScreenMonitoring && !hasValidScreenShare) {
      toast.error('Chưa chia sẻ toàn màn hình', {
        description: 'Bạn phải chia sẻ toàn màn hình trước khi vào làm bài.',
      })
      return
    }

    if (data.requireFullscreen && !hasValidFullscreen) {
      toast.error('Chưa bật toàn màn hình', {
        description: 'Bạn phải bật chế độ toàn màn hình trước khi vào làm bài.',
      })
      return
    }

    try {
      setIsStarting(true)
      const result = await takeExamApi.startExam(targetScheduleId, {
        faceVerificationId,
        password: password || undefined,
        webcamConfirmed: data.enableWebcam ? hasValidWebcam : undefined,
        webcamStatus: data.enableWebcam ? (hasValidWebcam ? 'ACTIVE' : 'PERMISSION_DENIED') : 'NOT_REQUIRED',
        screenShareConfirmed: data.enableScreenMonitoring ? hasValidScreenShare : undefined,
        screenShareStatus: data.enableScreenMonitoring ? (hasValidScreenShare ? 'ACTIVE' : 'PERMISSION_DENIED') : 'NOT_REQUIRED',
      })
      navigateToExam(targetScheduleId, result.attemptId, faceVerificationId)
    } catch (error: unknown) {
      const message = error instanceof AxiosError
        ? error.response?.data?.message
        : null
      if (faceVerificationId && typeof message === 'string' && message.includes('Face verification has expired or was already used')) {
        webcam.stop()
        screenShare.stop()
        if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
        setIsWebcamDialogOpen(false)
        setFaceGrantId(undefined)
        setIsFaceDialogOpen(true)
        toast.error('Phiên xác minh đã hết hạn. Vui lòng quét lại khuôn mặt.')
        return
      }
      toast.error(message || 'Không thể bắt đầu bài thi')
    } finally {
      setIsStarting(false)
    }
  }

  const proceedToFaceVerification = async () => {
    if (isCheckingFace) return
    setIsCheckingFace(true)
    try {
      const profile = await studentFaceApi.profile()
      if (profile.enabled) {
        setIsFaceDialogOpen(true)
      } else {
        continueAfterFaceVerification()
      }
    } catch {
      toast.error('Không thể kiểm tra yêu cầu xác minh khuôn mặt. Vui lòng thử lại.')
    } finally {
      setIsCheckingFace(false)
    }
  }

  const continueAfterFaceVerification = (grantId?: string) => {
    setFaceGrantId(grantId)
    if (data.enableWebcam || data.enableScreenMonitoring || data.requireFullscreen || (!canResume && data.requiresPassword)) {
      setIsWebcamDialogOpen(true)
    } else {
      void startOrResumeExam(grantId)
    }
  }

  const checkManualApproval = async () => {
    try {
      const grant = await studentFaceApi.manualApproval(scheduleId ?? data.id)
      if (!grant?.id) {
        toast.error('Chưa có xác nhận từ giảng viên coi thi.')
        return
      }
      setIsFaceDialogOpen(false)
      continueAfterFaceVerification(grant.id)
    } catch {
      toast.error('Không thể kiểm tra xác nhận của giảng viên coi thi.')
    }
  }

  const handleStartExam = () => {
    webcam.stop()
    screenShare.stop()
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined)
    setFaceGrantId(undefined)
    void proceedToFaceVerification()
  }

  const handleCloseWebcamDialog = () => {
    if (isStarting) return
    webcam.stop()
    screenShare.stop()
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => undefined)
    }
    setPassword('')
    setFaceGrantId(undefined)
    setIsWebcamDialogOpen(false)
  }

  const handleEnableCamera = () => {
    void webcam.start().catch(() => undefined)
  }

  const handleEnableScreenShare = () => {
    void screenShare.start().catch(() => undefined)
  }

  const handleEnableFullscreen = () => document.documentElement.requestFullscreen()

  const label = canResume ? 'Tiếp tục làm bài' : 'Vào làm bài'

  return (
    <>
      <div className="w-full space-y-3 sm:w-auto">
        {(data.enableWebcam || data.enableScreenMonitoring || data.requireFullscreen || data.requiresPassword) && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-[11px] text-blue-900">
            <p className="font-bold">Kiểm tra trước khi vào thi</p>
            <div className="mt-2 grid gap-1.5">
              {data.enableWebcam && <span>Camera phải bật và thấy rõ khuôn mặt.</span>}
              {data.enableScreenMonitoring && <span>Chọn chia sẻ toàn bộ màn hình, không chọn tab hoặc cửa sổ riêng.</span>}
              {data.requiresPassword && <span>Chuẩn bị mật khẩu ca thi do giảng viên cung cấp.</span>}
              <span>Giữ kết nối mạng ổn định; hệ thống sẽ tự lưu trong lúc làm bài.</span>
            </div>
          </div>
        )}
        <button
          type="button"
          disabled={isStarting || isCheckingFace}
          onClick={handleStartExam}
          className="w-full rounded-xl bg-blue-600 px-6 py-2.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          {isStarting || isCheckingFace ? 'Đang xử lý...' : label}
        </button>
      </div>

      <WebcamCheckDialog
        isOpen={isWebcamDialogOpen}
        stream={webcam.stream}
        status={webcam.status}
        errorMessage={webcam.errorMessage}
        screenStream={screenShare.stream}
        screenStatus={screenShare.status}
        screenErrorMessage={screenShare.errorMessage}
        isStartingExam={isStarting}
        faceVerified={Boolean(faceGrantId)}
        requiresWebcam={data.enableWebcam}
        requiresScreenShare={data.enableScreenMonitoring}
        requiresFullscreen={data.requireFullscreen}
        requiresPassword={!canResume && data.requiresPassword}
        password={password}
        onPasswordChange={setPassword}
        onEnableCamera={handleEnableCamera}
        onEnableScreenShare={handleEnableScreenShare}
        onEnableFullscreen={handleEnableFullscreen}
        onClose={handleCloseWebcamDialog}
        onContinue={() => void startOrResumeExam(faceGrantId)}
      />
      {isFaceDialogOpen && (
        <div className="fixed inset-0 z-50 flex flex-col items-center overflow-y-auto overscroll-contain bg-slate-900/60 p-3 sm:p-4" role="dialog" aria-modal="true" aria-label="Xác minh khuôn mặt trước khi vào thi">
          <div className="my-auto w-full max-w-2xl shrink-0 space-y-3">
            <FaceVerification
              purpose="EXAM_ENTRY"
              scheduleId={scheduleId ?? data.id}
              onClose={() => setIsFaceDialogOpen(false)}
              onPassed={(grantId) => {
                if (!grantId) {
                  toast.error('Phiên xác minh không hợp lệ. Vui lòng thử lại.')
                  return
                }
                setIsFaceDialogOpen(false)
                continueAfterFaceVerification(grantId)
              }}
            />
            <button type="button" onClick={() => void checkManualApproval()} className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-blue-700">
              Kiểm tra xác nhận của giảng viên coi thi
            </button>
          </div>
        </div>
      )}
    </>
  )
}
