import { ChevronLeft, ChevronRight, Maximize2, MonitorUp, Save, Send, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import ExamSubmitDialog from './components/take-exam/ExamSubmitDialog'
import ExamWebcamPanel from './components/take-exam/ExamWebcamPanel'
import QuestionCard from './components/take-exam/QuestionCard'
import QuestionNavigator from './components/take-exam/QuestionNavigator'
import TakeExamHeader from './components/take-exam/TakeExamHeader'
import TakeExamProgress from './components/take-exam/TakeExamProgress'
import './components/take-exam/take-exam.css'
import { useExamIntegrityGuard } from './hooks/take-exam/useExamIntegrityGuard'
import { isExamScreenShareStreamLive, type ExamScreenShareStatus, useExamScreenShare } from './hooks/take-exam/useExamScreenShare'
import { useExamWebcam } from './hooks/take-exam/useExamWebcam'
import { captureScreenEvidence, useScreenShareViolationMonitor } from './hooks/take-exam/useScreenShareViolationMonitor'
import { useWebcamViolationMonitor } from './hooks/take-exam/useWebcamViolationMonitor'
import { useStudentLiveStreamPublisher } from './hooks/take-exam/useStudentLiveCameraPublisher'
import { useTakeExam } from './hooks/take-exam/useTakeExam'
import { useGetExamAttempt, useRecordViolationMutation, useRunCodeMutation, useSendHeartbeatMutation } from './hooks/take-exam/useTakeExamApi'
import type {
  QuestionAnswer,
  TakeExamAnswers,
} from './types/take-exam.types'
import { takeExamApi, type ExamSessionScreenShareStatus, type ExamSessionWebcamStatus, type RunCodeResponse } from './api/student-take-exam.api'
import type { RecordViolationPayload } from './api/student-take-exam.api'
import { hasAnswer } from './components/take-exam/take-exam.utils'
import { useDebounce } from 'use-debounce'
import {
  cancelScheduledExamWebcamStop,
  isExamWebcamStreamLive,
  scheduleExamWebcamStop,
} from './utils/exam-webcam'
import type { ExamWebcamStatus } from './hooks/take-exam/useExamWebcam'

function toSessionWebcamStatus(status: ExamWebcamStatus, stream: MediaStream | null, required: boolean): ExamSessionWebcamStatus {
  if (!required) return 'NOT_REQUIRED'
  if (status === 'ACTIVE' && isExamWebcamStreamLive(stream)) return 'ACTIVE'
  if (status === 'PERMISSION_DENIED') return 'PERMISSION_DENIED'
  if (status === 'BLOCKED') return 'BLOCKED'
  return 'DISCONNECTED'
}

function toSessionScreenShareStatus(status: ExamScreenShareStatus, stream: MediaStream | null, required: boolean): ExamSessionScreenShareStatus {
  if (!required) return 'NOT_REQUIRED'
  if (status === 'ACTIVE' && isExamScreenShareStreamLive(stream)) return 'ACTIVE'
  if (status === 'PERMISSION_DENIED') return 'PERMISSION_DENIED'
  if (status === 'REQUESTING') return 'PENDING_PERMISSION'
  return 'STOPPED'
}

export default function StudentTakeExamPage() {
  const { courseOfferingId, scheduleId } = useParams<{
    courseOfferingId: string
    scheduleId: string
  }>()
  const navigate = useNavigate()
  const location = useLocation()

  const attemptId = location.state?.attemptId

  const resultPath = `/student/course-offerings/${courseOfferingId}/exam-schedules/${scheduleId}/result`

  const [isQuestionNavigatorOpen, setIsQuestionNavigatorOpen] = useState(false)
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [runCodeResult, setRunCodeResult] = useState<RunCodeResponse | null>(null)
  const [runCodeError, setRunCodeError] = useState<string | null>(null)
  const [runCodeErrorQuestionId, setRunCodeErrorQuestionId] = useState<string | null>(null)
  const previousWebcamStatusRef = useRef<ExamSessionWebcamStatus | null>(null)
  const previousScreenStatusRef = useRef<ExamSessionScreenShareStatus | null>(null)

  const { data: session, isLoading, error } = useGetExamAttempt(scheduleId ?? '', attemptId, !!scheduleId && !!attemptId)
  const { mutateAsync: runCodeApi, isPending: isRunningCode } = useRunCodeMutation()
  const { mutate: sendHeartbeat } = useSendHeartbeatMutation()
  const { mutateAsync: recordViolation } = useRecordViolationMutation()
  const {
    stream: webcamStream,
    status: webcamStatus,
    errorMessage: webcamErrorMessage,
    start: startWebcam,
  } = useExamWebcam(session?.integritySettings.enableWebcam ?? false)
  const {
    stream: screenStream,
    status: screenStatus,
    errorMessage: screenErrorMessage,
    start: startScreenShare,
  } = useExamScreenShare(session?.integritySettings.enableScreenMonitoring ?? false)

  useEffect(() => {
    cancelScheduledExamWebcamStop()
    return scheduleExamWebcamStop
  }, [])

  const defaultAnswers = useMemo<TakeExamAnswers>(() => {
    if (!session) return {}
    return session.questions.reduce<TakeExamAnswers>((answersObj, question) => {
      if (question.type === 'MULTIPLE_CHOICE') {
        answersObj[question.id] = Array.isArray(question.answer) ? question.answer : []
      } else {
        answersObj[question.id] = question.answer
      }
      return answersObj
    }, {})
  }, [session])

  const { control, setValue } = useForm<TakeExamAnswers>({
    defaultValues: defaultAnswers,
  })
  const answers = useWatch({ control })
  const [debouncedAnswers] = useDebounce(answers, 2000)

  const handleTimeExpired = useCallback(() => {
    toast.error('Hết thời gian làm bài', {
      description: 'Bài thi đã được nộp tự động bằng dữ liệu hiện có.',
    })
    navigate(resultPath, { state: { attemptId } })
  }, [attemptId, navigate, resultPath])

  const handleSubmitted = useCallback(() => {
    toast.success('Đã nộp bài thi', {
      description: 'Bài làm đã được nộp thành công.',
    })
    navigate(resultPath, { state: { attemptId } })
  }, [attemptId, navigate, resultPath])

  const {
    currentQuestion,
    currentQuestionIndex,
    secondsRemaining,
    flaggedQuestionIds,
    phase,
    saveState,
    nextQuestion,
    previousQuestion,
    goToQuestion,
    toggleFlag,
    saveAnswersToServer,
    markSubmitted,
  } = useTakeExam({
    scheduleId: scheduleId ?? '',
    attemptId: attemptId ?? '',
    session: session ?? null,
    answers,
    onTimeExpired: handleTimeExpired,
    onSubmitted: handleSubmitted
  })

  const handleViolationDetected = useCallback((payload: RecordViolationPayload) => {
    if (!scheduleId || !attemptId) return undefined
    return recordViolation({
      scheduleId,
      attemptId,
      data: payload,
    })
  }, [attemptId, recordViolation, scheduleId])

  const handleViolationEnded = useCallback(async (violationId: string, endedAt?: string) => {
    if (!scheduleId || !attemptId) return
    await takeExamApi.endViolation(scheduleId, attemptId, violationId, endedAt).catch(() => undefined)
  }, [attemptId, scheduleId])

  const handleCaptureScreenEvidence = useCallback(() => captureScreenEvidence(screenStream), [screenStream])

  const {
    isFullscreenActive,
    fullscreenExitCountdown,
    requestFullscreen,
  } = useExamIntegrityGuard({
    enabled: phase === 'IN_PROGRESS' && Boolean(session),
    blockCopyPaste: session?.integritySettings.blockCopyPaste ?? false,
    blockRightClick: session?.integritySettings.blockRightClick ?? false,
    requireFullscreen: session?.integritySettings.requireFullscreen ?? false,
    onViolation: handleViolationDetected,
    onEndViolation: handleViolationEnded,
    captureScreenEvidence: handleCaptureScreenEvidence,
    fullscreenViolationStorageKey: scheduleId && attemptId ? `soes:fullscreen-violation:${scheduleId}:${attemptId}` : undefined,
  })

  useWebcamViolationMonitor({
    enabled: phase === 'IN_PROGRESS' && Boolean(session?.integritySettings.enableWebcam),
    scheduleId: scheduleId ?? '',
    attemptId: attemptId ?? '',
    stream: webcamStream,
    webcamStatus,
  })

  useScreenShareViolationMonitor({
    enabled: phase === 'IN_PROGRESS' && Boolean(session?.integritySettings.enableScreenMonitoring),
    scheduleId: scheduleId ?? '',
    attemptId: attemptId ?? '',
    stream: screenStream,
    screenShareStatus: screenStatus,
  })

  useStudentLiveStreamPublisher({
    enabled: phase === 'IN_PROGRESS' && Boolean(session?.integritySettings.enableWebcam),
    scheduleId: scheduleId ?? '',
    attemptId: attemptId ?? '',
    stream: webcamStream,
    streamType: 'WEBCAM',
  })

  useStudentLiveStreamPublisher({
    enabled: phase === 'IN_PROGRESS' && Boolean(session?.integritySettings.enableScreenMonitoring),
    scheduleId: scheduleId ?? '',
    attemptId: attemptId ?? '',
    stream: screenStream,
    streamType: 'SCREEN',
  })

  useEffect(() => {
    if (!scheduleId || !attemptId || phase !== 'IN_PROGRESS' || !session) return

    const webcamHeartbeatStatus = toSessionWebcamStatus(webcamStatus, webcamStream, session.integritySettings.enableWebcam)
    const screenShareHeartbeatStatus = toSessionScreenShareStatus(screenStatus, screenStream, session.integritySettings.enableScreenMonitoring)

    sendHeartbeat({ scheduleId, attemptId, data: { webcamStatus: webcamHeartbeatStatus, screenShareStatus: screenShareHeartbeatStatus } })
    const intervalId = window.setInterval(() => {
      const nextWebcamHeartbeatStatus = toSessionWebcamStatus(webcamStatus, webcamStream, session.integritySettings.enableWebcam)
      const nextScreenShareHeartbeatStatus = toSessionScreenShareStatus(screenStatus, screenStream, session.integritySettings.enableScreenMonitoring)
      sendHeartbeat({ scheduleId, attemptId, data: { webcamStatus: nextWebcamHeartbeatStatus, screenShareStatus: nextScreenShareHeartbeatStatus } })
    }, 10_000)

    return () => window.clearInterval(intervalId)
  }, [attemptId, phase, scheduleId, screenStatus, screenStream, sendHeartbeat, session, webcamStatus, webcamStream])

  useEffect(() => {
    if (phase !== 'IN_PROGRESS' || !session?.integritySettings.enableWebcam) return

    const currentStatus = toSessionWebcamStatus(webcamStatus, webcamStream, true)
    const previousStatus = previousWebcamStatusRef.current
    previousWebcamStatusRef.current = currentStatus

    if (previousStatus === currentStatus) return
    if (currentStatus === 'ACTIVE') {
      if (previousStatus && previousStatus !== 'ACTIVE') {
        toast.success('Camera đã hoạt động lại', {
          description: 'Hệ thống đã ghi nhận thời điểm camera được khôi phục.',
        })
      }
      return
    }

    const title = currentStatus === 'PERMISSION_DENIED'
      ? 'Quyền camera bị từ chối'
      : currentStatus === 'BLOCKED'
        ? 'Camera không gửi được hình ảnh'
        : 'Camera đã tắt hoặc mất kết nối'

    toast.warning(title, {
      description: 'Bạn cần mở lại camera. Sự kiện này đã được ghi nhận để giảng viên xem xét.',
    })
  }, [phase, session?.integritySettings.enableWebcam, webcamStatus, webcamStream])

  useEffect(() => {
    if (phase !== 'IN_PROGRESS' || !session?.integritySettings.enableScreenMonitoring) return

    const currentStatus = toSessionScreenShareStatus(screenStatus, screenStream, true)
    const previousStatus = previousScreenStatusRef.current
    previousScreenStatusRef.current = currentStatus

    if (previousStatus === currentStatus) return
    if (currentStatus === 'ACTIVE') {
      if (previousStatus && previousStatus !== 'ACTIVE') {
        toast.success('Chia sẻ màn hình đã hoạt động lại', {
          description: 'Hệ thống đã ghi nhận thời điểm chia sẻ màn hình được khôi phục.',
        })
      }
      return
    }

    toast.warning(currentStatus === 'PERMISSION_DENIED' ? 'Quyền chia sẻ màn hình bị từ chối' : 'Chia sẻ màn hình đã dừng', {
      description: 'Bạn cần chia sẻ lại màn hình. Sự kiện này đã được ghi nhận để giảng viên xem xét.',
    })
  }, [phase, screenStatus, screenStream, session?.integritySettings.enableScreenMonitoring])

  // Auto-save when answers change
  useEffect(() => {
    if (!session || phase !== 'IN_PROGRESS') return
    const hasAnyAnswer = Object.values(debouncedAnswers).some(val => val !== undefined && val !== '' && (Array.isArray(val) ? val.length > 0 : true))
    if (hasAnyAnswer) {
      saveAnswersToServer()
    }
  }, [debouncedAnswers, phase, saveAnswersToServer, session])

  const currentQuestionId = currentQuestion?.id
  const visibleRunCodeResult = runCodeResult?.questionId === currentQuestionId ? runCodeResult : null
  const visibleRunCodeError = runCodeErrorQuestionId === currentQuestionId ? runCodeError : null

  const answeredCount = session ? session.questions.filter((question) => hasAnswer(answers[question.id])).length : 0
  const unansweredCount = session ? session.questions.length - answeredCount : 0
  const flaggedCount = flaggedQuestionIds.length

  const handleBack = useCallback(() => {
    navigate(`/student/course-offerings/${courseOfferingId}`, {
      state: { activeTab: 'timeline' },
    })
  }, [courseOfferingId, navigate])

  const handleAnswerChange = useCallback(
    (answer: QuestionAnswer) => {
      if (!currentQuestion) return
      setValue(currentQuestion.id, answer, { shouldDirty: true })
    },
    [currentQuestion, setValue],
  )

  const handleEnableExamCamera = useCallback(() => {
    void startWebcam().catch(() => undefined)
  }, [startWebcam])

  const handleEnableScreenShare = useCallback(() => {
    void startScreenShare().catch(() => undefined)
  }, [startScreenShare])

  const handleRunCode = useCallback(
    (sourceCode: string) => {
      if (!scheduleId || !attemptId || !currentQuestion || phase !== 'IN_PROGRESS') return
      setRunCodeError(null)
      setRunCodeErrorQuestionId(currentQuestion.id)
      setRunCodeResult(null)
      runCodeApi({ scheduleId, attemptId, questionId: currentQuestion.id, sourceCode })
        .then(setRunCodeResult)
        .catch(() => {
          setRunCodeError('Không thể chạy mã nguồn. Vui lòng thử lại.')
        })
    },
    [attemptId, currentQuestion, phase, runCodeApi, scheduleId],
  )

  const handleSave = useCallback(() => {
    if (phase !== 'IN_PROGRESS') return
    saveAnswersToServer()
  }, [phase, saveAnswersToServer])

  const handleSubmitRequest = useCallback(() => {
    if (phase !== 'IN_PROGRESS') return
    setIsSubmitDialogOpen(true)
  }, [phase])

  const handleSubmitCancel = useCallback(() => {
    if (!isSubmitting) setIsSubmitDialogOpen(false)
  }, [isSubmitting])

  const handleSubmitConfirm = useCallback(() => {
    if (isSubmitting) return
    setIsSubmitting(true)
    markSubmitted().catch(() => {
       setIsSubmitting(false)
       setIsSubmitDialogOpen(false)
    })
  }, [isSubmitting, markSubmitted])

  const handleQuestionSelect = useCallback(
    (questionId: string) => {
      goToQuestion(questionId)
    },
    [goToQuestion],
  )

  if (!scheduleId || !attemptId) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
        Thiếu thông tin bài thi hoặc chưa bắt đầu làm bài.
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
        Đang tải nội dung bài thi...
      </div>
    )
  }

  if (error || !session) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-6 text-sm text-red-500">
        Không thể tải nội dung bài thi. Vui lòng thử lại.
      </div>
    )
  }

  if (!currentQuestion) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 px-6 text-sm text-slate-500">
        Không tìm thấy câu hỏi trong bài thi.
      </div>
    )
  }

  const isLastQuestion = currentQuestionIndex === session.questions.length - 1
  const saveLabel = saveState === 'SAVING' ? 'Đang lưu...' : saveState === 'SAVED' ? 'Đã lưu' : 'Lưu đáp án'

  return (
    <div className="take-exam-workspace h-dvh min-h-0 w-full overflow-hidden bg-slate-50">
      <ExamWebcamPanel
        required={session.integritySettings.enableWebcam}
        stream={webcamStream}
        status={webcamStatus}
        errorMessage={webcamErrorMessage}
        onEnableCamera={handleEnableExamCamera}
      />
      {!isFullscreenActive && phase === 'IN_PROGRESS' && (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 rounded-2xl border border-amber-200 bg-white p-4 shadow-2xl" role="alert" aria-live="assertive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
                <ShieldAlert size={22} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-slate-900">Bạn đã thoát chế độ toàn màn hình.</p>
                <p className="mt-1 text-xs leading-5 text-slate-600">
                  Tự động chụp màn hình sau {fullscreenExitCountdown ?? 5} giây nếu bạn chưa quay lại. Thoát quá 7 giây hoặc chuyển ứng dụng sẽ bị ghi nhận nghiêm trọng.
                </p>
              </div>
            </div>
            <button type="button" onClick={() => void requestFullscreen()} className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-bold text-white hover:bg-blue-700">
              <Maximize2 size={18} />
              Quay lại ngay
            </button>
          </div>
        </div>
      )}
      {session.integritySettings.enableScreenMonitoring && phase === 'IN_PROGRESS' && !isExamScreenShareStreamLive(screenStream) && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/70 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="screen-share-required-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <MonitorUp size={32} />
            </div>
            <h2 id="screen-share-required-title" className="mt-5 text-xl font-bold text-slate-900">Cần chia sẻ toàn màn hình</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ca thi này yêu cầu giám sát toàn màn hình. Nội dung bài thi sẽ tiếp tục sau khi bạn chọn Toàn bộ màn hình/Entire screen, không chọn cửa sổ hoặc tab.
            </p>
            {screenErrorMessage && <p className="mt-3 rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">{screenErrorMessage}</p>}
            <button type="button" onClick={handleEnableScreenShare} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              <MonitorUp size={18} />
              Chia sẻ toàn màn hình
            </button>
          </div>
        </div>
      )}
      <main className="take-exam-page relative h-full overflow-y-auto px-4 py-5 sm:px-6 lg:px-8">
        <div className="relative mx-auto w-full max-w-[1180px] space-y-4">
            <TakeExamHeader
              session={session}
              secondsRemaining={secondsRemaining}
              answeredCount={answeredCount}
              totalQuestions={session.questions.length}
              onBack={handleBack}
            />

            <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_270px]">
              <section className="min-w-0 space-y-4">
                <TakeExamProgress
                  answeredCount={answeredCount}
                  totalQuestions={session.questions.length}
                  flaggedCount={flaggedCount}
                  secondsRemaining={secondsRemaining}
                />

                <form
                  onSubmit={(event) => event.preventDefault()}
                  aria-label="Bài làm"
                  className="space-y-4"
                >
                  <QuestionCard
                    question={currentQuestion}
                    questionIndex={currentQuestionIndex}
                    totalQuestions={session.questions.length}
                    answer={answers[currentQuestion.id]}
                    onAnswerChange={handleAnswerChange}
                    isFlagged={flaggedQuestionIds.includes(currentQuestion.id)}
                    onToggleFlag={() => toggleFlag(currentQuestion.id)}
                    onRunCode={handleRunCode}
                    isRunningCode={isRunningCode}
                    runCodeResult={visibleRunCodeResult}
                    runCodeError={visibleRunCodeError}
                    blockRightClick={session.integritySettings.blockRightClick}
                  />

                  <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={handleSave}
                          disabled={saveState === 'SAVING' || phase !== 'IN_PROGRESS'}
                          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-semibold text-slate-600 transition-colors hover:border-blue-200 hover:bg-blue-50/50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <Save size={15} aria-hidden="true" />
                          {saveLabel}
                        </button>
                        <span className="text-[11px] text-slate-400" aria-live="polite">
                          {saveState === 'SAVING' ? 'Đang đồng bộ dữ liệu...' : 'Dữ liệu được lưu tự động'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
                        <button
                          type="button"
                          onClick={previousQuestion}
                          disabled={currentQuestionIndex === 0 || phase !== 'IN_PROGRESS'}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 px-3.5 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <ChevronLeft size={16} aria-hidden="true" />
                          Quay lại
                        </button>
                        <button
                          type="button"
                          onClick={nextQuestion}
                          disabled={isLastQuestion || phase !== 'IN_PROGRESS'}
                          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Tiếp theo
                          <ChevronRight size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={handleSubmitRequest}
                          disabled={phase !== 'IN_PROGRESS'}
                          className="col-span-2 inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 text-xs font-semibold text-white shadow-sm shadow-purple-200 transition-colors hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500/40 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-1"
                        >
                          <Send size={15} aria-hidden="true" />
                          Nộp bài
                        </button>
                      </div>
                    </div>
                  </div>
                </form>
              </section>

              <QuestionNavigator
                questions={session.questions}
                currentQuestionId={currentQuestion.id}
                answers={answers}
                flaggedQuestionIds={flaggedQuestionIds}
                isOpen={isQuestionNavigatorOpen}
                onToggleOpen={() => setIsQuestionNavigatorOpen((isOpen) => !isOpen)}
                onSelect={handleQuestionSelect}
              />
            </div>
        </div>
      </main>

      <ExamSubmitDialog
        isOpen={isSubmitDialogOpen}
        unansweredCount={unansweredCount}
        onCancel={handleSubmitCancel}
        onConfirm={handleSubmitConfirm}
        isSubmitting={isSubmitting}
      />
    </div>
  )
}
