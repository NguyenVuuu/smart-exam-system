import { useEffect, useRef, useState } from 'react'
import { getSocket } from '../../../api/socket'

export type AiGenerationStage = 'UPLOADING' | 'PREPARING' | 'GENERATING' | 'CORRECTING' | 'VALIDATING' | 'COMPLETED' | 'FAILED'
export interface AiGenerationProgress {
  stage: AiGenerationStage
  elapsedSeconds: number
  connected: boolean
  completedCount?: number
  requestedCount?: number
}
interface ProgressEvent extends Omit<AiGenerationProgress, 'elapsedSeconds' | 'connected'> {
  requestId: string
  elapsedMs: number
}

export function useAiGenerationProgress() {
  const activeRequest = useRef<string | null>(null)
  const startedAt = useRef(0)
  const [isGenerating, setIsGenerating] = useState(false)
  const [progress, setProgress] = useState<AiGenerationProgress>({ stage: 'PREPARING', elapsedSeconds: 0, connected: false })

  useEffect(() => {
    const socket = getSocket()
    const update = (event: ProgressEvent) => {
      if (event.requestId !== activeRequest.current) return
      setProgress(current => ({ ...current, stage: event.stage,
        completedCount: event.completedCount ?? current.completedCount,
        requestedCount: event.requestedCount ?? current.requestedCount }))
    }
    const connected = () => setProgress(current => ({ ...current, connected: true }))
    const disconnected = () => setProgress(current => ({ ...current, connected: false }))
    socket.on('ai:generation-progress', update)
    socket.on('connect', connected)
    socket.on('disconnect', disconnected)
    return () => {
      activeRequest.current = null
      socket.off('ai:generation-progress', update)
      socket.off('connect', connected)
      socket.off('disconnect', disconnected)
    }
  }, [])

  useEffect(() => {
    if (!isGenerating) return
    const timer = window.setInterval(() => setProgress(current => ({ ...current,
      elapsedSeconds: Math.floor((Date.now() - startedAt.current) / 1000) })), 1000)
    return () => window.clearInterval(timer)
  }, [isGenerating])

  const start = (uploading: boolean) => {
    if (activeRequest.current) return null
    const requestId = crypto.randomUUID()
    activeRequest.current = requestId
    startedAt.current = Date.now()
    setProgress({ stage: uploading ? 'UPLOADING' : 'PREPARING', elapsedSeconds: 0, connected: getSocket().connected })
    setIsGenerating(true)
    return requestId
  }
  const finish = () => {
    activeRequest.current = null
    setIsGenerating(false)
  }
  return { isGenerating, progress, start, finish }
}
