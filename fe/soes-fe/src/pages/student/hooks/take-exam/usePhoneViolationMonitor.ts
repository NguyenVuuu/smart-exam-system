import { useEffect, useState } from 'react'
import { takeExamApi, type PhoneDetectionMetadata } from '../../api/student-take-exam.api'
import { isExamWebcamStreamLive } from '../../utils/exam-webcam'

interface PhoneMessage {
  type: 'ready' | 'result' | 'error'
  fatal?: boolean
  message?: string
  evidence?: { blob: Blob; metadata: PhoneDetectionMetadata } | null
  diagnostics?: unknown
}

export function usePhoneViolationMonitor(input: {
  enabled: boolean
  scheduleId: string
  attemptId: string
  stream: MediaStream | null
}) {
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!input.enabled || !input.scheduleId || !input.attemptId || !input.stream || !isExamWebcamStreamLive(input.stream)) return
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.srcObject = input.stream
    void video.play().catch(() => undefined)

    let cancelled = false
    let ready = false
    let busy = false
    let timer: number | undefined
    let watchdog: number | undefined
    let lastVideoTime = -1
    let uploading = false
    const queue: Array<NonNullable<PhoneMessage['evidence']>> = []
    let worker: Worker
    try { worker = new Worker('/mediapipe/vision-worker.js', { name: 'exam-phone' }) }
    catch {
      queueMicrotask(() => {
        if (!cancelled) setError('Không khởi động được nhận diện điện thoại; camera và nhận diện khuôn mặt vẫn hoạt động.')
      })
      video.pause()
      video.srcObject = null
      return () => { cancelled = true }
    }
    let debug = false
    try { debug = localStorage.getItem('soes:vision-debug') === '1' } catch { /* Storage may be unavailable. */ }

    const schedule = (delay = 50) => {
      if (!cancelled) timer = window.setTimeout(() => { void tick() }, delay)
    }

    const upload = async () => {
      if (uploading || cancelled) return
      uploading = true
      try {
        while (!cancelled && queue.length) {
          const evidence = queue.shift()!
          try {
            const response = await takeExamApi.recordViolation(input.scheduleId, input.attemptId, {
              violationType: 'PHONE_DETECTED', severity: 'MEDIUM',
              description: `Possible ${evidence.metadata.category} detected. Evidence requires teacher review; this is not a conclusion of misconduct.`,
              detectedAt: evidence.metadata.capturedAt,
              metadata: evidence.metadata,
              evidenceFiles: [new File([evidence.blob], `phone-${Date.parse(evidence.metadata.capturedAt)}.jpg`, { type: 'image/jpeg' })],
            })
            if (debug) console.info('[exam-vision] phone event saved', { id: response.id })
            if (!cancelled) setError(null)
          } catch (cause) {
            try { worker.postMessage({ type: 'phone-upload-failed' }) } catch { /* The worker may have stopped. */ }
            if (debug) console.error('[exam-vision] phone upload failed', cause)
            if (!cancelled) setError('Không gửi được ảnh bằng chứng điện thoại. Hệ thống sẽ thử lại khi có sự kiện tiếp theo.')
          }
        }
      } finally { uploading = false }
    }

    const fail = () => {
      ready = false
      busy = false
      window.clearTimeout(watchdog)
      worker.terminate()
      if (!cancelled) setError('Nhận diện điện thoại tạm ngừng; camera và nhận diện khuôn mặt vẫn hoạt động.')
    }

    worker.onerror = fail
    worker.onmessage = ({ data }: MessageEvent<PhoneMessage>) => {
      if (cancelled) return
      window.clearTimeout(watchdog)
      if (debug && data.diagnostics) console.info('[exam-vision] phone', data.diagnostics)
      if (data.type === 'ready') {
        ready = true
        setError(null)
        schedule(0)
        return
      }
      if (data.type === 'error') {
        if (debug) console.error('[exam-vision] phone worker', data.message)
        fail()
        return
      }
      busy = false
      if (data.evidence) { queue.push(data.evidence); void upload() }
      schedule()
    }

    const tick = async () => {
      if (cancelled || !ready || busy) return
      if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastVideoTime) {
        schedule()
        return
      }
      busy = true
      let frame: ImageBitmap | null = null
      try {
        lastVideoTime = video.currentTime
        frame = await createImageBitmap(video)
        if (cancelled) return
        worker.postMessage({ type: 'frame', frame, timestamp: performance.now(), capturedAt: Date.now() }, [frame])
        watchdog = window.setTimeout(fail, 30_000)
      } catch {
        busy = false
        if (!cancelled) setError('Không đọc được khung hình camera để nhận diện điện thoại.')
        schedule()
      } finally { frame?.close() }
    }

    worker.postMessage({ type: 'init', mode: 'phone', debug })
    watchdog = window.setTimeout(fail, 60_000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.clearTimeout(watchdog)
      worker.terminate()
      queue.length = 0
      video.pause()
      video.srcObject = null
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream])

  return input.enabled ? error : null
}
