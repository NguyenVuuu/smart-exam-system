import { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface UseExamIntegrityGuardOptions {
  enabled: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
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
}: UseExamIntegrityGuardOptions) {
  const lastToastAtRef = useRef(0)

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
  }, [blockCopyPaste, blockRightClick, enabled])
}
