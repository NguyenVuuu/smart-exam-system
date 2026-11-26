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
    let retryTimer: number | undefined
    let retryDelay = 2_000
    let queuedBytes = 0
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
      if (uploading || cancelled || !navigator.onLine) return
      window.clearTimeout(retryTimer)
      uploading = true
      try {
        while (!cancelled && queue.length) {
          const evidence = queue[0]
          try {
            const response = await takeExamApi.recordViolation(input.scheduleId, input.attemptId, {
              violationType: 'PHONE_DETECTED', severity: 'MEDIUM',
              description: `Possible ${evidence.metadata.category} detected. Evidence requires teacher review; this is not a conclusion of misconduct.`,
              detectedAt: evidence.metadata.capturedAt,
              metadata: evidence.metadata,
              evidenceFiles: [new File([evidence.blob], `phone-${Date.parse(evidence.metadata.capturedAt)}.jpg`, { type: 'image/jpeg' })],
            })
            if (debug) console.info('[exam-vision] phone event saved', { id: response.id })
            queue.shift()
            queuedBytes -= evidence.blob.size
            retryDelay = 2_000
            if (!cancelled) setError(null)
          } catch (cause) {
            try { worker.postMessage({ type: 'phone-upload-failed' }) } catch { /* The worker may have stopped. */ }
            if (debug) console.error('[exam-vision] phone upload failed', cause)
            if (!cancelled) {
              setError('Ảnh bằng chứng chưa gửi được. Hệ thống đang giữ ảnh gốc và sẽ thử gửi lại.')
              retryTimer = window.setTimeout(() => { void upload() }, retryDelay)
              retryDelay = Math.min(15_000, retryDelay * 2)
            }
            break
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
      if (data.evidence) {
        if (queue.length < 20 && queuedBytes + data.evidence.blob.size <= 12 * 1024 * 1024) {
          queue.push(data.evidence)
          queuedBytes += data.evidence.blob.size
          void upload()
        } else {
          setError('Hàng đợi ảnh bằng chứng đã đầy. Hãy kiểm tra kết nối mạng.')
          worker.postMessage({ type: 'phone-upload-failed' })
        }
      }
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
    const retryOnline = () => { void upload() }
    window.addEventListener('online', retryOnline)
    watchdog = window.setTimeout(fail, 60_000)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.clearTimeout(watchdog)
      window.clearTimeout(retryTimer)
      window.removeEventListener('online', retryOnline)
      worker.terminate()
      queue.length = 0
      video.pause()
      video.srcObject = null
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream])

  return input.enabled ? error : null
}
