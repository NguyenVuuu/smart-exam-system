import { useCallback, useEffect, useRef, useState } from 'react'
import type {
  DraftSaveState,
  TakeExamAnswers,
  TakeExamPhase,
  TakeExamSession,
} from '../../types/take-exam.types'
import { useSaveAnswerMutation, useSubmitExamMutation } from './useTakeExamApi'

interface UseTakeExamOptions {
  examId: string
  attemptId: string
  session: TakeExamSession | null
  answers: TakeExamAnswers
  onTimeExpired?: () => void
  onSubmitted?: () => void
}

export function useTakeExam({
  examId,
  attemptId,
  session,
  answers,
  onTimeExpired,
  onSubmitted,
}: UseTakeExamOptions) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [secondsRemaining, setSecondsRemaining] = useState(0)
  const [flaggedQuestionIds, setFlaggedQuestionIds] = useState<string[]>([])
  const [phase, setPhase] = useState<TakeExamPhase>('IN_PROGRESS')
  const [saveState, setSaveState] = useState<DraftSaveState>('IDLE')

  const expirationHandledRef = useRef(false)
  const phaseRef = useRef(phase)
  const sessionInitializedRef = useRef(false)

  const { mutateAsync: saveAnswersApi } = useSaveAnswerMutation()
  const { mutateAsync: submitExamApi } = useSubmitExamMutation()

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  // Initialize timer once session is loaded
  useEffect(() => {
    if (!session?.attemptEndAt || sessionInitializedRef.current) return

    const timeoutId = window.setTimeout(() => {
      const endAt = new Date(session.attemptEndAt).getTime()
      if (isNaN(endAt)) return

      const remaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000))
      setSecondsRemaining(remaining)
      sessionInitializedRef.current = true

      if (remaining === 0) {
        expirationHandledRef.current = true
        setPhase('EXPIRED')
        onTimeExpired?.()
      }
    }, 0)

    return () => window.clearTimeout(timeoutId)
  }, [onTimeExpired, session?.attemptEndAt])

  // Countdown timer — only runs after session is initialized
  useEffect(() => {
    if (phase !== 'IN_PROGRESS' || !session?.attemptEndAt || !sessionInitializedRef.current) return

    const endAt = new Date(session.attemptEndAt).getTime()
    if (isNaN(endAt)) return

    const intervalId = window.setInterval(() => {
      const actualRemaining = Math.max(0, Math.floor((endAt - Date.now()) / 1000))
      setSecondsRemaining(actualRemaining)

      if (actualRemaining <= 0 && !expirationHandledRef.current) {
        expirationHandledRef.current = true
        setPhase('EXPIRED')
        onTimeExpired?.()
      }
    }, 1000)

    return () => window.clearInterval(intervalId)
  }, [onTimeExpired, phase, session?.attemptEndAt])

  const goToQuestion = useCallback(
    (questionId: string) => {
      const nextIndex = (session?.questions ?? []).findIndex((question) => question.id === questionId)
      if (nextIndex >= 0) setCurrentQuestionIndex(nextIndex)
    },
    [session?.questions],
  )

  const nextQuestion = useCallback(() => {
    setCurrentQuestionIndex((currentIndex) => Math.min(currentIndex + 1, (session?.questions.length ?? 1) - 1))
  }, [session?.questions.length])

  const previousQuestion = useCallback(() => {
    setCurrentQuestionIndex((currentIndex) => Math.max(currentIndex - 1, 0))
  }, [])

  const toggleFlag = useCallback((questionId: string) => {
    setFlaggedQuestionIds((currentIds) =>
      currentIds.includes(questionId)
        ? currentIds.filter((id) => id !== questionId)
        : [...currentIds, questionId],
    )
  }, [])

  const saveAnswersToServer = useCallback(async () => {
    if (phaseRef.current !== 'IN_PROGRESS' || !session) return

    setSaveState('SAVING')
    try {
      const formattedAnswers = Object.entries(answers).flatMap(([questionId, answerValue]) => {
        const question = session.questions.find((q) => q.id === questionId)
        if (!question) return []

        if (question.type === 'CODING') {
          if (typeof answerValue !== 'string' || answerValue.trim().length === 0) return []
          return [{ questionId, answer: answerValue }]
        }

        // SINGLE_CHOICE requires a plain string; MULTIPLE_CHOICE requires an array
        const requiresString = question.type === 'SINGLE_CHOICE'
        const normalized: string[] = Array.isArray(answerValue)
          ? answerValue
          : answerValue
            ? [answerValue]
            : []

        if (normalized.length === 0) return []
        return [{ questionId, answer: requiresString ? normalized[0] : normalized }]
      })

      if (formattedAnswers.length > 0) {
        await saveAnswersApi({ examId, attemptId, data: formattedAnswers })
      }
      setSaveState('SAVED')
    } catch (error) {
      console.error('Failed to save answers', error)
      setSaveState('IDLE')
    }
  }, [answers, attemptId, examId, saveAnswersApi, session])

  const markSubmitted = useCallback(async () => {
    if (phaseRef.current !== 'IN_PROGRESS') return
    try {
      await saveAnswersToServer()
      await submitExamApi({ examId, attemptId })
      setPhase('SUBMITTED')
      onSubmitted?.()
    } catch (error) {
      console.error('Failed to submit exam', error)
      throw error
    }
  }, [attemptId, examId, onSubmitted, saveAnswersToServer, submitExamApi])

  const currentQuestion = session?.questions[currentQuestionIndex] ?? null

  return {
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
  }
}
