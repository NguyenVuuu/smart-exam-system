import { Camera, LoaderCircle, ShieldAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ExamWebcamStatus } from '../../hooks/take-exam/useExamWebcam'
import { isExamWebcamStreamLive } from '../../utils/exam-webcam'

interface ExamWebcamPanelProps {
  required: boolean
  stream: MediaStream | null
  status: ExamWebcamStatus
  errorMessage: string | null
  onEnableCamera: () => void
}

const webcamStatusLabels: Partial<Record<ExamWebcamStatus, string>> = {
  DISCONNECTED: 'Camera đã tắt hoặc mất kết nối',
  PERMISSION_DENIED: 'Quyền camera đã bị từ chối',
  BLOCKED: 'Camera đang bị chặn hoặc không có khung hình mới',
  UNAVAILABLE: 'Không tìm thấy camera',
  ERROR: 'Camera chưa hoạt động ổn định',
}

export default function ExamWebcamPanel({ required, stream, status, errorMessage, onEnableCamera }: ExamWebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  if (!required) return null

  const isActive = status === 'ACTIVE' && isExamWebcamStreamLive(stream)
  const isRequesting = status === 'REQUESTING'

  if (!isActive) {
    return (
      <aside className="fixed right-4 top-4 z-40 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-amber-200 bg-white p-4 shadow-xl" role="status" aria-live="polite">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
            <ShieldAlert size={22} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-slate-900">{webcamStatusLabels[status] ?? 'Camera chưa được bật'}</p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {errorMessage ?? 'Ca thi yêu cầu camera hoạt động trong suốt thời gian làm bài. Sự kiện này đã được ghi nhận.'}
            </p>
            <button
              type="button"
              onClick={onEnableCamera}
              disabled={isRequesting}
              className="mt-3 inline-flex min-h-9 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {isRequesting ? <LoaderCircle className="animate-spin" size={16} /> : <Camera size={16} />}
              {isRequesting ? 'Đang mở camera...' : 'Mở lại camera'}
            </button>
          </div>
        </div>
      </aside>
    )
  }

  return (
    <aside className="fixed bottom-4 right-4 z-40 w-40 overflow-hidden rounded-2xl border border-white/20 bg-slate-950 shadow-2xl sm:w-48" aria-label="Camera giám sát đang hoạt động">
      <div className="relative aspect-video">
        <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" />
        <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/95 px-2 py-1 text-[10px] font-bold text-white">
          <span className="h-1.5 w-1.5 rounded-full bg-white" /> CAMERA
        </span>
      </div>
      <p className="px-3 py-2 text-[10px] font-medium text-slate-300">Camera bắt buộc đang hoạt động</p>
    </aside>
  )
}
