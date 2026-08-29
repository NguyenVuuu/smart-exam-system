import { Camera, CameraOff, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ExamWebcamStatus } from '../../hooks/take-exam/useExamWebcam'

interface WebcamCheckDialogProps {
  isOpen: boolean
  stream: MediaStream | null
  status: ExamWebcamStatus
  errorMessage: string | null
  isStartingExam: boolean
  onEnableCamera: () => void
  onClose: () => void
  onContinue: () => void
}

export default function WebcamCheckDialog({
  isOpen,
  stream,
  status,
  errorMessage,
  isStartingExam,
  onEnableCamera,
  onClose,
  onContinue,
}: WebcamCheckDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  if (!isOpen) return null

  const isRequesting = status === 'REQUESTING'
  const isReady = status === 'ACTIVE' && Boolean(stream)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="webcam-check-title">
      <div className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Kiểm tra trước khi thi</p>
            <h2 id="webcam-check-title" className="mt-1 text-xl font-bold text-slate-900">Bật camera để vào làm bài</h2>
            <p className="mt-1 text-sm text-slate-500">Kỳ thi này yêu cầu camera hoạt động trong suốt thời gian làm bài.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isStartingExam} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-[1.35fr_0.65fr]">
          <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
            {isReady ? (
              <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" aria-label="Hình ảnh camera của bạn" />
            ) : (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-300">
                {isRequesting ? <LoaderCircle className="animate-spin text-blue-400" size={42} /> : <CameraOff size={42} />}
                <p className="mt-3 text-sm font-semibold">{isRequesting ? 'Đang khởi động camera...' : 'Camera chưa được bật'}</p>
              </div>
            )}
            {isReady && (
              <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                <span className="h-2 w-2 rounded-full bg-white" /> Đang hoạt động
              </span>
            )}
          </div>

          <div className="flex flex-col justify-between gap-4">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
              <ShieldCheck className="mb-2 text-blue-600" size={22} />
              <p className="font-bold">Trước khi tiếp tục</p>
              <p className="mt-1 leading-6 text-blue-800">Đảm bảo khuôn mặt đủ sáng, camera không bị che và không có ứng dụng khác đang sử dụng camera.</p>
            </div>
            {errorMessage && <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium leading-5 text-rose-700" role="alert">{errorMessage}</p>}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isStartingExam} className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          {!isReady ? (
            <button type="button" onClick={onEnableCamera} disabled={isRequesting} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {isRequesting ? <LoaderCircle className="animate-spin" size={18} /> : <Camera size={18} />}
              {isRequesting ? 'Đang mở camera...' : 'Bật camera'}
            </button>
          ) : (
            <button type="button" onClick={onContinue} disabled={isStartingExam} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
              {isStartingExam && <LoaderCircle className="animate-spin" size={18} />}
              {isStartingExam ? 'Đang vào bài thi...' : 'Camera đã sẵn sàng, tiếp tục'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
