import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import type { RecordViolationPayload } from '../../api/student-take-exam.api'

interface UseExamIntegrityGuardOptions {
  enabled: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  requireFullscreen?: boolean
  inactivityMs?: number
  onViolation?: (payload: RecordViolationPayload) => void
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

export function useExamIntegrityGuard({
  enabled,
  blockCopyPaste,
  blockRightClick,
  requireFullscreen = true,
  inactivityMs = 60_000,
  onViolation,
}: UseExamIntegrityGuardOptions) {
  const lastToastAtRef = useRef(0)
  const lastViolationAtRef = useRef<Record<string, number>>({})
  const hasEnteredFullscreenRef = useRef(false)
  const [isFullscreenActive, setIsFullscreenActive] = useState(() => Boolean(document.fullscreenElement))

  const reportViolation = useCallback((payload: Omit<RecordViolationPayload, 'detectedAt'>) => {
    const now = Date.now()
    const lastAt = lastViolationAtRef.current[payload.violationType] ?? 0
    if (now - lastAt < 5_000) return

    lastViolationAtRef.current[payload.violationType] = now
    onViolation?.({ ...payload, detectedAt: new Date(now).toISOString() })
  }, [onViolation])

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
      if (action !== 'contextmenu') {
        reportViolation({
          violationType: 'COPY_PASTE',
          severity: 'LOW',
          description: `Blocked ${action} action during exam.`,
        })
      }
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
        hasEnteredFullscreenRef.current = true
        return
      }

      if (hasEnteredFullscreenRef.current) {
        reportViolation({
          violationType: 'FULLSCREEN_EXIT',
          severity: 'HIGH',
          description: 'Student exited fullscreen mode during exam.',
        })
      }
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    const timeoutId = window.setTimeout(() => {
      void requestFullscreen()
    }, 0)

    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [enabled, reportViolation, requestFullscreen, requireFullscreen])

  useEffect(() => {
    if (!enabled) return

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'hidden') return
      reportViolation({
        violationType: 'TAB_SWITCH',
        severity: 'MEDIUM',
        description: 'Student switched away from the exam tab.',
      })
    }

    const handleWindowBlur = () => {
      reportViolation({
        violationType: 'TAB_SWITCH',
        severity: 'LOW',
        description: 'Exam window lost focus.',
      })
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleWindowBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleWindowBlur)
    }
  }, [enabled, reportViolation])

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
    requestFullscreen,
  }
}
