import { ChevronLeft, ChevronRight, Maximize2, Save, Send, ShieldAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useExamWebcam } from './hooks/take-exam/useExamWebcam'
import { useTakeExam } from './hooks/take-exam/useTakeExam'
import { useGetExamAttempt, useRecordViolationMutation, useRunCodeMutation } from './hooks/take-exam/useTakeExamApi'
import type {
  QuestionAnswer,
  TakeExamAnswers,
} from './types/take-exam.types'
import type { RunCodeResponse } from './api/student-take-exam.api'
import type { RecordViolationPayload } from './api/student-take-exam.api'
import { hasAnswer } from './components/take-exam/take-exam.utils'
import { useDebounce } from 'use-debounce'
import {
  cancelScheduledExamWebcamStop,
  scheduleExamWebcamStop,
} from './utils/exam-webcam'

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

  const { data: session, isLoading, error } = useGetExamAttempt(scheduleId ?? '', attemptId, !!scheduleId && !!attemptId)
  const { mutateAsync: runCodeApi, isPending: isRunningCode } = useRunCodeMutation()
  const { mutate: recordViolation } = useRecordViolationMutation()
  const {
    stream: webcamStream,
    status: webcamStatus,
    errorMessage: webcamErrorMessage,
    start: startWebcam,
  } = useExamWebcam(session?.integritySettings.enableWebcam ?? false)

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
    if (!scheduleId || !attemptId) return
    recordViolation({ scheduleId, attemptId, data: payload })
  }, [attemptId, recordViolation, scheduleId])

  const {
    isFullscreenActive,
    requestFullscreen,
  } = useExamIntegrityGuard({
    enabled: phase === 'IN_PROGRESS' && Boolean(session),
    blockCopyPaste: session?.integritySettings.blockCopyPaste ?? false,
    blockRightClick: session?.integritySettings.blockRightClick ?? false,
    requireFullscreen: true,
    onViolation: handleViolationDetected,
  })

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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="fullscreen-required-title">
          <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
              <ShieldAlert size={32} />
            </div>
            <h2 id="fullscreen-required-title" className="mt-5 text-xl font-bold text-slate-900">Cần bật toàn màn hình</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">Nội dung bài thi tạm khóa vì kỳ thi yêu cầu chế độ toàn màn hình.</p>
            <button type="button" onClick={() => void requestFullscreen()} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700">
              <Maximize2 size={18} />
              Bật toàn màn hình
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
