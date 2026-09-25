import {
  Camera,
  CameraOff,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LoaderCircle,
  Maximize2,
  MonitorUp,
  ShieldCheck,
  Wifi,
  WifiOff,
  X,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { isExamScreenShareStreamLive, type ExamScreenShareStatus } from '../../hooks/take-exam/useExamScreenShare'
import type { ExamWebcamStatus } from '../../hooks/take-exam/useExamWebcam'
import { isExamWebcamStreamLive } from '../../utils/exam-webcam'

interface WebcamCheckDialogProps {
  isOpen: boolean
  stream: MediaStream | null
  status: ExamWebcamStatus
  errorMessage: string | null
  screenStream?: MediaStream | null
  screenStatus?: ExamScreenShareStatus
  screenErrorMessage?: string | null
  isStartingExam: boolean
  requiresWebcam: boolean
  requiresScreenShare?: boolean
  requiresFullscreen?: boolean
  requiresPassword: boolean
  password: string
  onPasswordChange: (value: string) => void
  onEnableCamera: () => void
  onEnableScreenShare?: () => void
  onEnableFullscreen?: () => Promise<void> | void
  onClose: () => void
  onContinue: () => void
}

export default function WebcamCheckDialog({
  isOpen,
  stream,
  status,
  errorMessage,
  screenStream = null,
  screenStatus = 'IDLE',
  screenErrorMessage = null,
  isStartingExam,
  requiresWebcam,
  requiresScreenShare = false,
  requiresFullscreen = false,
  requiresPassword,
  password,
  onPasswordChange,
  onEnableCamera,
  onEnableScreenShare,
  onEnableFullscreen,
  onClose,
  onContinue,
}: WebcamCheckDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isOnline, setIsOnline] = useState(() => navigator.onLine)
  const [isFullscreenActive, setIsFullscreenActive] = useState(() => Boolean(document.fullscreenElement))
  const [fullscreenError, setFullscreenError] = useState<string | null>(null)

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream
  }, [stream])

  useEffect(() => {
    if (!isOpen) return

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleFullscreenChange = () => {
      setIsFullscreenActive(Boolean(document.fullscreenElement))
      if (document.fullscreenElement) setFullscreenError(null)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [isOpen])

  if (!isOpen) return null

  const isRequesting = status === 'REQUESTING'
  const isRequestingScreen = screenStatus === 'REQUESTING'
  const isWebcamReady = !requiresWebcam || (status === 'ACTIVE' && isExamWebcamStreamLive(stream))
  const isScreenReady = !requiresScreenShare || (screenStatus === 'ACTIVE' && isExamScreenShareStreamLive(screenStream))
  const canUseCamera = !requiresWebcam || Boolean(navigator.mediaDevices?.getUserMedia)
  const canUseScreenShare = !requiresScreenShare || Boolean(navigator.mediaDevices?.getDisplayMedia)
  const canUseFullscreen = !requiresFullscreen || Boolean(document.fullscreenEnabled && document.documentElement.requestFullscreen)
  const isBrowserReady = canUseCamera && canUseScreenShare && canUseFullscreen
  const isFullscreenReady = !requiresFullscreen || isFullscreenActive
  const canContinue = isBrowserReady
    && isOnline
    && isWebcamReady
    && isScreenReady
    && isFullscreenReady
    && (!requiresPassword || password.trim().length > 0)

  const checklist = [
    {
      key: 'browser',
      label: 'Trình duyệt',
      ok: isBrowserReady,
      detail: getBrowserSupportText({ canUseCamera, canUseScreenShare, canUseFullscreen }),
      icon: <Globe2 size={18} />,
    },
    {
      key: 'network',
      label: 'Kết nối mạng',
      ok: isOnline,
      detail: isOnline ? 'Thiết bị đang online.' : 'Thiết bị đang offline. Hãy kết nối mạng trước khi vào bài.',
      icon: isOnline ? <Wifi size={18} /> : <WifiOff size={18} />,
    },
    {
      key: 'webcam',
      label: requiresWebcam ? 'Camera' : 'Camera không bắt buộc',
      ok: isWebcamReady,
      detail: requiresWebcam ? (isWebcamReady ? 'Camera đã bật và có tín hiệu hình ảnh.' : 'Cần bật camera trước khi tiếp tục.') : 'Ca thi này không yêu cầu camera.',
      icon: <Camera size={18} />,
    },
    {
      key: 'screen',
      label: requiresScreenShare ? 'Chia sẻ màn hình' : 'Chia sẻ màn hình không bắt buộc',
      ok: isScreenReady,
      detail: requiresScreenShare ? (isScreenReady ? 'Đã chia sẻ toàn bộ màn hình.' : 'Cần chọn Toàn bộ màn hình/Entire screen.') : 'Ca thi này không yêu cầu chia sẻ màn hình.',
      icon: <MonitorUp size={18} />,
    },
    {
      key: 'fullscreen',
      label: requiresFullscreen ? 'Toàn màn hình' : 'Toàn màn hình không bắt buộc',
      ok: isFullscreenReady,
      detail: requiresFullscreen ? (isFullscreenReady ? 'Đang ở chế độ toàn màn hình.' : 'Cần bật toàn màn hình trước khi vào bài.') : 'Ca thi này không yêu cầu toàn màn hình.',
      icon: <Maximize2 size={18} />,
    },
  ]

  const handleEnableFullscreen = async () => {
    setFullscreenError(null)
    try {
      if (onEnableFullscreen) {
        await onEnableFullscreen()
      } else {
        await document.documentElement.requestFullscreen()
      }
      setIsFullscreenActive(Boolean(document.fullscreenElement))
    } catch {
      setFullscreenError('Không thể bật toàn màn hình. Hãy kiểm tra quyền trình duyệt rồi thử lại.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4" role="dialog" aria-modal="true" aria-labelledby="webcam-check-title">
      <div className="flex max-h-[calc(100dvh-1rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:rounded-3xl">
        <div className="flex shrink-0 items-start justify-between border-b border-slate-100 px-4 py-3 sm:px-6 sm:py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-blue-600">Kiểm tra trước khi thi</p>
            <h2 id="webcam-check-title" className="mt-1 text-xl font-bold text-slate-900">Xác nhận thiết bị sẵn sàng</h2>
            <p className="mt-1 text-sm text-slate-500">Hoàn tất các kiểm tra bắt buộc để tránh lỗi ngay lúc làm bài.</p>
          </div>
          <button type="button" onClick={onClose} disabled={isStartingExam} className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50" aria-label="Đóng">
            <X size={20} />
          </button>
        </div>

        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 ${requiresWebcam ? 'grid gap-4 md:grid-cols-[1.15fr_0.85fr] md:gap-5' : ''}`}>
          {requiresWebcam && (
            <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950 md:sticky md:top-0">
              {isWebcamReady ? (
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full scale-x-[-1] object-cover" aria-label="Hình ảnh camera của bạn" />
              ) : (
                <div className="flex h-full flex-col items-center justify-center px-6 text-center text-slate-300">
                  {isRequesting ? <LoaderCircle className="animate-spin text-blue-400" size={42} /> : <CameraOff size={42} />}
                  <p className="mt-3 text-sm font-semibold">{isRequesting ? 'Đang khởi động camera...' : 'Camera chưa được bật'}</p>
                </div>
              )}
              {isWebcamReady && (
                <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                  <span className="h-2 w-2 rounded-full bg-white" /> Đang hoạt động
                </span>
              )}
            </div>
          )}

          <div className="flex min-h-0 flex-col gap-3 sm:gap-4">
            <div className="space-y-2">
              {checklist.map((item) => (
                <div key={item.key} className="flex gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
                  <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${item.ok ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {item.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-800">{item.label}</p>
                      {item.ok ? <CheckCircle2 size={16} className="text-emerald-600" /> : <XCircle size={16} className="text-amber-600" />}
                    </div>
                    <p className="mt-1 text-xs leading-5 text-slate-500">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {requiresWebcam && (
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950">
                <ShieldCheck className="mb-2 text-blue-600" size={22} />
                <p className="font-bold">Trước khi tiếp tục</p>
                <p className="mt-1 leading-6 text-blue-800">Đảm bảo khuôn mặt đủ sáng, camera không bị che và không có ứng dụng khác đang sử dụng camera.</p>
              </div>
            )}

            {requiresPassword && (
              <label className="block text-sm font-semibold text-slate-700">
                Mật khẩu vào thi
                <span className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                  <KeyRound size={18} className="text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => onPasswordChange(event.target.value)}
                    className="h-11 min-w-0 flex-1 border-0 bg-transparent text-sm font-normal outline-none"
                    placeholder="Nhập mật khẩu ca thi"
                    autoComplete="off"
                  />
                  <button type="button" onClick={() => setShowPassword((visible) => !visible)} className="text-slate-400 hover:text-slate-700" aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </span>
              </label>
            )}

            {errorMessage && <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium leading-5 text-rose-700" role="alert">{errorMessage}</p>}
            {screenErrorMessage && <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium leading-5 text-rose-700" role="alert">{screenErrorMessage}</p>}
            {fullscreenError && <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium leading-5 text-rose-700" role="alert">{fullscreenError}</p>}
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-4 py-3 shadow-[0_-8px_20px_rgba(15,23,42,0.04)] sm:flex-row sm:justify-end sm:gap-3 sm:px-6 sm:py-4">
          <button type="button" onClick={onClose} disabled={isStartingExam} className="min-h-11 rounded-xl border border-slate-200 bg-white px-5 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">Hủy</button>
          {requiresWebcam && !isWebcamReady ? (
            <button type="button" onClick={onEnableCamera} disabled={isRequesting || !canUseCamera} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              {isRequesting ? <LoaderCircle className="animate-spin" size={18} /> : <Camera size={18} />}
              {isRequesting ? 'Đang mở camera...' : 'Bật camera'}
            </button>
          ) : requiresScreenShare && !isScreenReady ? (
            <button type="button" onClick={onEnableScreenShare} disabled={isRequestingScreen || !canUseScreenShare} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
              {isRequestingScreen ? <LoaderCircle className="animate-spin" size={18} /> : <MonitorUp size={18} />}
              {isRequestingScreen ? 'Đang mở chia sẻ...' : 'Chia sẻ toàn màn hình'}
            </button>
          ) : requiresFullscreen && !isFullscreenReady ? (
            <button type="button" onClick={() => void handleEnableFullscreen()} disabled={!canUseFullscreen} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60">
              <Maximize2 size={18} />
              Bật toàn màn hình
            </button>
          ) : (
            <button type="button" onClick={onContinue} disabled={isStartingExam || !canContinue} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-60">
              {isStartingExam && <LoaderCircle className="animate-spin" size={18} />}
              {isStartingExam ? 'Đang vào bài thi...' : 'Tiếp tục vào bài thi'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function getBrowserSupportText({
  canUseCamera,
  canUseScreenShare,
  canUseFullscreen,
}: {
  canUseCamera: boolean
  canUseScreenShare: boolean
  canUseFullscreen: boolean
}) {
  const missing: string[] = []
  if (!canUseCamera) missing.push('camera')
  if (!canUseScreenShare) missing.push('chia sẻ màn hình')
  if (!canUseFullscreen) missing.push('toàn màn hình')

  if (missing.length === 0) return 'Trình duyệt hỗ trợ camera, chia sẻ màn hình và toàn màn hình.'
  return `Trình duyệt chưa hỗ trợ: ${missing.join(', ')}. Hãy dùng Chrome, Edge hoặc trình duyệt tương thích.`
}
