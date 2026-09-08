import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { RecordViolationPayload, RecordViolationResponse } from '../../api/student-take-exam.api'

interface UseExamIntegrityGuardOptions {
  enabled: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  requireFullscreen?: boolean
  inactivityMs?: number
  onViolation?: (payload: RecordViolationPayload) => Promise<RecordViolationResponse | void> | RecordViolationResponse | void
  onEndViolation?: (violationId: string, endedAt?: string) => Promise<void> | void
  captureScreenEvidence?: () => Promise<File[] | undefined>
  fullscreenViolationStorageKey?: string
}

type BlockedAction = 'copy' | 'cut' | 'paste' | 'contextmenu'

const ACTION_MESSAGES: Record<BlockedAction, string> = {
  copy: 'Không được sao chép trong khi làm bài.',
  cut: 'Không được cắt nội dung trong khi làm bài.',
  paste: 'Không được dán nội dung trong khi làm bài.',
  contextmenu: 'Menu chuột phải đã bị tắt trong khi làm bài.',
}

const BLOCKED_SHORTCUTS: Record<string, BlockedAction> = {
  c: 'copy',
  x: 'cut',
  v: 'paste',
}

const FULLSCREEN_GRACE_MS = 3_000
const FULLSCREEN_COUNTDOWN_SECONDS = 5
const FULLSCREEN_SEVERE_MS = 7_000
const TAB_SWITCH_CAPTURE_DELAY_MS = 450

export function useExamIntegrityGuard({
  enabled,
  blockCopyPaste,
  blockRightClick,
  requireFullscreen = true,
  inactivityMs = 60_000,
  onViolation,
  onEndViolation,
  captureScreenEvidence,
  fullscreenViolationStorageKey,
}: UseExamIntegrityGuardOptions) {
  const lastToastAtRef = useRef(0)
  const lastViolationAtRef = useRef<Record<string, number>>({})
  const hasEnteredFullscreenRef = useRef(false)
  const fullscreenExitStartedAtRef = useRef<number | null>(null)
  const fullscreenSevereReportedRef = useRef(false)
  const fullscreenCaptureAttemptedRef = useRef(false)
  const fullscreenCapturedEvidenceRef = useRef<File[] | undefined>(undefined)
  const fullscreenViolationIdRef = useRef<string | null>(null)
  const lastTabSwitchReportedAtRef = useRef(0)
  const tabSwitchTimeoutRef = useRef<number | null>(null)
  const [isFullscreenActive, setIsFullscreenActive] = useState(() => Boolean(document.fullscreenElement))
  const [fullscreenExitCountdown, setFullscreenExitCountdown] = useState<number | null>(null)

  const reportViolation = useCallback(async (payload: Omit<RecordViolationPayload, 'detectedAt'> & { detectedAt?: string }, dedupe = true) => {
    const now = Date.now()
    const lastAt = lastViolationAtRef.current[payload.violationType] ?? 0
    if (dedupe && now - lastAt < 5_000) return undefined

    lastViolationAtRef.current[payload.violationType] = now
    return onViolation?.({ ...payload, detectedAt: payload.detectedAt ?? new Date(now).toISOString() })
  }, [onViolation])

  const closeFullscreenViolation = useCallback(async (endedAt = new Date().toISOString()) => {
    const violationId = fullscreenViolationIdRef.current
    if (!violationId) return
    fullscreenViolationIdRef.current = null
    if (fullscreenViolationStorageKey) window.localStorage.removeItem(fullscreenViolationStorageKey)
    await onEndViolation?.(violationId, endedAt)
  }, [fullscreenViolationStorageKey, onEndViolation])

  const openFullscreenViolation = useCallback(async (startedAt: number) => {
    if (fullscreenViolationIdRef.current) return
    const response = await reportViolation({
      violationType: 'FULLSCREEN_EXIT',
      severity: 'MEDIUM',
      description: 'Student exited fullscreen mode during exam.',
      detectedAt: new Date(startedAt).toISOString(),
    }, false)
    if (response?.id) {
      fullscreenViolationIdRef.current = response.id
      if (fullscreenViolationStorageKey) window.localStorage.setItem(fullscreenViolationStorageKey, response.id)
    }
  }, [fullscreenViolationStorageKey, reportViolation])

  const reportSevereFullscreenExit = useCallback(async (startedAt: number, description: string) => {
    if (fullscreenSevereReportedRef.current) return
    fullscreenSevereReportedRef.current = true
    const evidenceFiles = fullscreenCapturedEvidenceRef.current ?? await captureScreenEvidence?.().catch(() => undefined)
    fullscreenCaptureAttemptedRef.current = true
    const response = await reportViolation({
      violationType: 'FULLSCREEN_EXIT',
      severity: 'HIGH',
      description,
      detectedAt: new Date(startedAt).toISOString(),
      evidenceFiles,
    }, false)
    if (response?.id) {
      fullscreenViolationIdRef.current = response.id
      if (fullscreenViolationStorageKey) window.localStorage.setItem(fullscreenViolationStorageKey, response.id)
    }
  }, [captureScreenEvidence, fullscreenViolationStorageKey, reportViolation])

  useEffect(() => {
    if (!fullscreenViolationStorageKey) return
    fullscreenViolationIdRef.current = window.localStorage.getItem(fullscreenViolationStorageKey)
  }, [fullscreenViolationStorageKey])

  const requestFullscreen = useCallback(async () => {
    if (!requireFullscreen || document.fullscreenElement) {
      setIsFullscreenActive(Boolean(document.fullscreenElement))
      return true
    }

    try {
      await document.documentElement.requestFullscreen()
      hasEnteredFullscreenRef.current = true
      setIsFullscreenActive(true)
      return true
    } catch {
      setIsFullscreenActive(false)
      toast.warning('Cần bật toàn màn hình', {
        description: 'Bài thi yêu cầu chế độ toàn màn hình để tiếp tục.',
      })
      return false
    }
  }, [requireFullscreen])

  useEffect(() => {
    if (!enabled || (!blockCopyPaste && !blockRightClick)) return

    function notify(action: BlockedAction) {
      const now = Date.now()
      if (now - lastToastAtRef.current < 1200) return

      lastToastAtRef.current = now
      toast.warning('Thao tác bị chặn', {
        description: ACTION_MESSAGES[action],
      })
    }

    function blockEvent(event: Event, action: BlockedAction) {
      event.preventDefault()
      event.stopPropagation()
      notify(action)
      void reportViolation({
        violationType: action === 'contextmenu' ? 'RIGHT_CLICK' : 'COPY_PASTE',
        severity: 'LOW',
        description: action === 'contextmenu'
          ? 'Blocked right-click/context menu during exam.'
          : `Blocked ${action} action during exam.`,
      }, false)
    }

    function handleClipboard(event: ClipboardEvent) {
      if (!blockCopyPaste) return
      blockEvent(event, event.type as BlockedAction)
    }

    function handleContextMenu(event: MouseEvent) {
      if (!blockRightClick) return
      blockEvent(event, 'contextmenu')
    }

    function handleBeforeInput(event: InputEvent) {
      if (!blockCopyPaste) return
      if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') {
        blockEvent(event, 'paste')
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (!blockCopyPaste) return
      const key = event.key.toLowerCase()
      const action = BLOCKED_SHORTCUTS[key]

      if ((event.ctrlKey || event.metaKey) && action) {
        blockEvent(event, action)
        return
      }

      if (event.shiftKey && key === 'insert') {
        blockEvent(event, 'paste')
      }
    }

    document.addEventListener('copy', handleClipboard, true)
    document.addEventListener('cut', handleClipboard, true)
    document.addEventListener('paste', handleClipboard, true)
    document.addEventListener('contextmenu', handleContextMenu, true)
    document.addEventListener('beforeinput', handleBeforeInput, true)
    document.addEventListener('keydown', handleKeyDown, true)

    return () => {
      document.removeEventListener('copy', handleClipboard, true)
      document.removeEventListener('cut', handleClipboard, true)
      document.removeEventListener('paste', handleClipboard, true)
      document.removeEventListener('contextmenu', handleContextMenu, true)
      document.removeEventListener('beforeinput', handleBeforeInput, true)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [blockCopyPaste, blockRightClick, enabled, reportViolation])

  useEffect(() => {
    if (!enabled || !requireFullscreen) return

    const handleFullscreenChange = () => {
      const active = Boolean(document.fullscreenElement)
      setIsFullscreenActive(active)
      if (active) {
        const exitedAt = fullscreenExitStartedAtRef.current
        const severeReported = fullscreenSevereReportedRef.current
        hasEnteredFullscreenRef.current = true
        fullscreenExitStartedAtRef.current = null
        fullscreenSevereReportedRef.current = false
        fullscreenCaptureAttemptedRef.current = false
        fullscreenCapturedEvidenceRef.current = undefined
        setFullscreenExitCountdown(null)
        if (exitedAt && !severeReported) {
          const durationMs = Date.now() - exitedAt
          if (durationMs < FULLSCREEN_GRACE_MS) {
            void reportViolation({
              violationType: 'FULLSCREEN_EXIT',
              severity: 'LOW',
              description: `Student briefly exited fullscreen mode for ${Math.ceil(durationMs / 1000)} seconds and returned.`,
              detectedAt: new Date(exitedAt).toISOString(),
            }, false)
          } else if (durationMs < FULLSCREEN_SEVERE_MS) {
            void reportViolation({
              violationType: 'FULLSCREEN_EXIT',
              severity: 'MEDIUM',
              description: `Student exited fullscreen mode for ${Math.ceil(durationMs / 1000)} seconds and returned before severe threshold.`,
              detectedAt: new Date(exitedAt).toISOString(),
            }, false)
          }
          void closeFullscreenViolation(new Date().toISOString())
        } else if (exitedAt) {
          void closeFullscreenViolation(new Date().toISOString())
        }
        return
      }

      if (hasEnteredFullscreenRef.current) {
        const startedAt = Date.now()
        fullscreenExitStartedAtRef.current = startedAt
        fullscreenSevereReportedRef.current = false
        fullscreenCaptureAttemptedRef.current = false
        fullscreenCapturedEvidenceRef.current = undefined
        setFullscreenExitCountdown(FULLSCREEN_COUNTDOWN_SECONDS)
        void openFullscreenViolation(startedAt)
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    const timeoutId = window.setTimeout(() => {
      void requestFullscreen()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      void closeFullscreenViolation(new Date().toISOString())
    }
  }, [closeFullscreenViolation, enabled, openFullscreenViolation, reportSevereFullscreenExit, reportViolation, requestFullscreen, requireFullscreen])

  useEffect(() => {
    if (!enabled || !requireFullscreen || fullscreenExitCountdown === null || !fullscreenExitStartedAtRef.current) return

    const startedAt = fullscreenExitStartedAtRef.current
    const elapsedMs = Date.now() - startedAt
    const secondsUntilCapture = Math.max(0, FULLSCREEN_COUNTDOWN_SECONDS - Math.floor(elapsedMs / 1000))
    if (secondsUntilCapture !== fullscreenExitCountdown) setFullscreenExitCountdown(secondsUntilCapture)

    if (elapsedMs >= FULLSCREEN_COUNTDOWN_SECONDS * 1000 && !fullscreenCaptureAttemptedRef.current) {
      fullscreenCaptureAttemptedRef.current = true
      void Promise.resolve(captureScreenEvidence?.())
        .then((files) => {
          fullscreenCapturedEvidenceRef.current = files
        })
        .catch(() => undefined)
    }

    if (elapsedMs >= FULLSCREEN_SEVERE_MS) {
      void reportSevereFullscreenExit(startedAt, 'Student exited fullscreen mode for more than 7 seconds during exam.')
    }

    const timeoutId = window.setTimeout(() => {
      const nextElapsedMs = Date.now() - startedAt
      setFullscreenExitCountdown(Math.max(0, FULLSCREEN_COUNTDOWN_SECONDS - Math.floor(nextElapsedMs / 1000)))
    }, 250)

    return () => window.clearTimeout(timeoutId)
  }, [captureScreenEvidence, enabled, fullscreenExitCountdown, reportSevereFullscreenExit, requireFullscreen])

  useEffect(() => {
    if (!enabled) return

    const reportTabSwitch = (description: string, baseSeverity: RecordViolationPayload['severity']) => {
      const now = Date.now()
      if (now - lastTabSwitchReportedAtRef.current < 500) return
      lastTabSwitchReportedAtRef.current = now

      const fullscreenExitStartedAt = fullscreenExitStartedAtRef.current
      const severity = fullscreenExitStartedAt ? 'HIGH' : baseSeverity
      if (fullscreenExitStartedAt) {
        void reportSevereFullscreenExit(
          fullscreenExitStartedAt,
          'Student exited fullscreen mode and switched away from the exam application.',
        )
      }
      if (tabSwitchTimeoutRef.current !== null) window.clearTimeout(tabSwitchTimeoutRef.current)
      tabSwitchTimeoutRef.current = window.setTimeout(() => {
        void Promise.resolve(captureScreenEvidence?.()).then((evidenceFiles) => {
          void reportViolation({
            violationType: 'TAB_SWITCH',
            severity,
            description,
            evidenceFiles,
          }, false)
        }).catch(() => {
          void reportViolation({
            violationType: 'TAB_SWITCH',
            severity,
            description,
          }, false)
        })
      }, TAB_SWITCH_CAPTURE_DELAY_MS)
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      reportTabSwitch('Student switched away from the exam tab.', 'MEDIUM')
    }

    const handleWindowBlur = () => {
      reportTabSwitch(
        fullscreenExitStartedAtRef.current ? 'Exam window lost focus after fullscreen exit.' : 'Exam window lost focus.',
        'LOW',
      )
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      if (tabSwitchTimeoutRef.current !== null) window.clearTimeout(tabSwitchTimeoutRef.current)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [captureScreenEvidence, enabled, reportSevereFullscreenExit, reportViolation])

  useEffect(() => {
    if (!enabled || inactivityMs <= 0) return

    let timeoutId: number | null = null

    const scheduleIdleCheck = () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      timeoutId = window.setTimeout(() => {
        reportViolation({
          violationType: 'INACTIVITY',
          severity: 'MEDIUM',
          description: `No browser activity detected for ${Math.round(inactivityMs / 1000)} seconds.`,
        })
        scheduleIdleCheck()
      }, inactivityMs)
    }

    const activityEvents: Array<keyof DocumentEventMap> = ['keydown', 'mousedown', 'mousemove', 'scroll', 'touchstart']
    activityEvents.forEach((eventName) => document.addEventListener(eventName, scheduleIdleCheck, true))
    scheduleIdleCheck()

    return () => {
      if (timeoutId !== null) window.clearTimeout(timeoutId)
      activityEvents.forEach((eventName) => document.removeEventListener(eventName, scheduleIdleCheck, true))
    }
  }, [enabled, inactivityMs, reportViolation])

  return {
    isFullscreenActive: !requireFullscreen || isFullscreenActive,
    fullscreenExitCountdown,
    requestFullscreen,
  }
}
