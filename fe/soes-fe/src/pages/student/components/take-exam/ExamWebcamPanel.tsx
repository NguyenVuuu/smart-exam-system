import { Camera, LoaderCircle, ShieldAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ExamWebcamStatus } from '../../hooks/take-exam/useExamWebcam'

interface ExamWebcamPanelProps {
  required: boolean
  stream: MediaStream | null
  status: ExamWebcamStatus
  errorMessage: string | null
  onEnableCamera: () => void
}

export default function ExamWebcamPanel({ required, stream, status, errorMessage, onEnableCamera }: ExamWebcamPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  if (!required) return null

  const isActive = status === 'ACTIVE' && Boolean(stream)
  const isRequesting = status === 'REQUESTING'

  if (!isActive) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-5 backdrop-blur-md" role="alertdialog" aria-modal="true" aria-labelledby="camera-required-title">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 text-center shadow-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
            <ShieldAlert size={32} />
          </div>
          <h2 id="camera-required-title" className="mt-5 text-xl font-bold text-slate-900">Camera phải được bật</h2>
          <p className="mt-2 text-sm leading-6 text-slate-500">Nội dung bài thi tạm khóa vì kỳ thi này yêu cầu camera hoạt động. Thời gian làm bài vẫn đang được tính.</p>
          {errorMessage && <p className="mt-4 rounded-xl bg-rose-50 p-3 text-xs font-medium leading-5 text-rose-700">{errorMessage}</p>}
          <button type="button" onClick={onEnableCamera} disabled={isRequesting} className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60">
            {isRequesting ? <LoaderCircle className="animate-spin" size={18} /> : <Camera size={18} />}
            {isRequesting ? 'Đang mở camera...' : 'Mở lại camera'}
          </button>
        </div>
      </div>
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
