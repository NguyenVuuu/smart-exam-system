import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { takeExamApi } from '../../api/student-take-exam.api'
import type { DraftSaveState, QuestionAnswer, TakeExamAnswers, TakeExamSession } from '../../types/take-exam.types'

const AUTOSAVE_DELAY_MS = 2_000
const SAVE_CONCURRENCY = 4

function normalizeAnswer(type: TakeExamSession['questions'][number]['type'], answer?: QuestionAnswer) {
  if (type === 'MULTIPLE_CHOICE') return Array.isArray(answer) ? answer : answer ? [answer] : []
  if (type === 'SINGLE_CHOICE') return Array.isArray(answer) ? answer[0] : answer || undefined
  return typeof answer === 'string' ? answer : undefined
}

function answerKey(answer: QuestionAnswer) {
  return Array.isArray(answer) ? JSON.stringify([...answer].sort()) : answer
}

interface ExamAnswerSaveOptions {
  scheduleId: string
  attemptId: string
  session: TakeExamSession | null
  answers: TakeExamAnswers
  enabled: boolean
}

interface AnswerSaveQueue {
  attemptId: string
  scheduleId: string
  saved: Map<string, string>
  tail: Promise<void>
}

export function useExamAnswerSave({ scheduleId, attemptId, session, answers, enabled }: ExamAnswerSaveOptions) {
  const [saveState, setSaveState] = useState<DraftSaveState>('IDLE')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const current = useRef({ session, answers, enabled })
  const queueRef = useRef<AnswerSaveQueue | null>(null)

  useLayoutEffect(() => {
    current.current = { session, answers, enabled }
    return () => { current.current.enabled = false }
  }, [session, answers, enabled])

  const saveAnswersToServer = useCallback(async (options?: { throwOnError?: boolean }) => {
    if (queueRef.current?.attemptId !== attemptId || queueRef.current.scheduleId !== scheduleId) {
      queueRef.current = { scheduleId, attemptId, saved: new Map(), tail: Promise.resolve() }
    }
    const queue = queueRef.current
    const save = queue.tail.then(async () => {
      const snapshot = current.current
      if (!snapshot.enabled || snapshot.session?.attemptId !== queue.attemptId) return
      const changed = snapshot.session.questions.flatMap(question => {
        const answer = normalizeAnswer(question.type, snapshot.answers[question.id])
        if (answer === undefined) return []
        const key = answerKey(answer)
        const original = normalizeAnswer(question.type, question.answer)
        const previous = queue.saved.get(question.id) ?? (original === undefined ? undefined : answerKey(original))
        return previous === key ? [] : [{ questionId: question.id, answer, key }]
      })
      if (!changed.length) return

      setSaveState('SAVING')
      for (let offset = 0; offset < changed.length; offset += SAVE_CONCURRENCY) {
        const batch = await Promise.allSettled(changed.slice(offset, offset + SAVE_CONCURRENCY).map(async ({
          questionId, answer, key,
        }) => {
          await takeExamApi.saveAnswer(queue.scheduleId, queue.attemptId, { questionId, answer })
          queue.saved.set(questionId, key)
        }))
        const failure = batch.find(result => result.status === 'rejected')
        if (failure) throw failure.reason
      }
      setSaveState('SAVED')
      setLastSavedAt(new Date().toISOString())
    })
    queue.tail = save.catch(() => undefined)
    try {
      await save
    } catch (error) {
      setSaveState('IDLE')
      if (options?.throwOnError) throw error
      console.error('Failed to save answers', error)
    }
  }, [attemptId, scheduleId])

  useEffect(() => {
    if (!enabled || !session) return
    const timer = window.setTimeout(() => { void saveAnswersToServer() }, AUTOSAVE_DELAY_MS)
    return () => window.clearTimeout(timer)
  }, [answers, enabled, saveAnswersToServer, session])

  useEffect(() => {
    if (!enabled || !session) return
    const retryUnsavedAnswers = () => { void saveAnswersToServer() }
    window.addEventListener('online', retryUnsavedAnswers)
    return () => window.removeEventListener('online', retryUnsavedAnswers)
  }, [enabled, saveAnswersToServer, session])

  return { saveState, lastSavedAt, saveAnswersToServer }
}
