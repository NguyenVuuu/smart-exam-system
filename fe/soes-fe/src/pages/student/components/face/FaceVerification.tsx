import { lazy, Suspense, useEffect, useState } from 'react'
import type { FaceLivenessDetectorProps } from '@aws-amplify/ui-react-liveness'
import { ScanFace } from 'lucide-react'
import { studentFaceApi, type FaceCompletion, type FaceSession } from '../../api/student-face.api'

const identityPoolId = import.meta.env.VITE_AWS_FACE_IDENTITY_POOL_ID as string | undefined
const FaceLivenessPanel = lazy(() => import('./FaceLivenessPanel'))
type LivenessError = Parameters<NonNullable<FaceLivenessDetectorProps['onError']>>[0]
type FailedFaceCompletion = Extract<FaceCompletion, { status: 'FAILED' }>

const feedbackGuidance: Record<string, string> = {
  FACE_NOT_VISIBLE: 'Giữ khuôn mặt trong khung hình suốt quá trình quét.',
  FACE_OBSTRUCTION_DETECTED: 'Bỏ vật che mặt như khẩu trang hoặc kính râm.',
  LOW_VIDEO_QUALITY_DETECTED: 'Lau camera và giữ thiết bị ổn định.',
  FACE_NOT_ALIGNED: 'Nhìn thẳng vào camera và đặt mặt giữa khung hình.',
  EYES_CLOSED_DETECTED: 'Giữ mắt mở khi làm theo hướng dẫn.',
  LOW_LIGHTING_DETECTED: 'Chuyển tới nơi sáng đều hơn.',
  HIGH_LIGHTING_DETECTED: 'Tránh ánh sáng quá gắt hoặc chiếu thẳng vào mặt.',
}

function describeFailedVerification(result: FailedFaceCompletion, purpose: 'ENROLLMENT' | 'EXAM_ENTRY') {
  if (result.requiresManualReview) return 'Xác minh nhiều lần chưa thành công. Vui lòng liên hệ giảng viên coi thi.'
  if (result.failureCode === 'FACE_MISMATCH') return 'Khuôn mặt không khớp hồ sơ đã đăng ký. Vui lòng thử lại.'
  if (result.failureCode === 'LIVENESS_LOW_CONFIDENCE') {
    const guidance = [...new Set(result.feedbackCodes ?? [])].flatMap((code) => feedbackGuidance[code] ? [feedbackGuidance[code]] : []).join(' ')
    return `Lần quét này chưa đủ tin cậy để xác minh. ${guidance || 'Hãy quét lại ở nơi sáng đều, nhìn thẳng camera và không che mặt.'}`
  }
  if (result.failureCode === 'LIVENESS_REFERENCE_IMAGE_MISSING') return 'AWS chưa nhận được ảnh tham chiếu đủ chất lượng. Vui lòng quét lại.'
  if (result.failureCode === 'LIVENESS_NOT_COMPLETED') return 'Phiên quét chưa hoàn tất. Vui lòng làm theo hướng dẫn trên camera và thử lại.'
  return purpose === 'ENROLLMENT' ? 'Chưa đăng ký được khuôn mặt. Vui lòng thử lại.' : 'Xác minh khuôn mặt chưa thành công. Vui lòng thử lại.'
}

function describeLivenessError({ state, error }: LivenessError) {
  if (error?.name === 'AccessDeniedException') return 'AWS từ chối truyền video xác minh. Hãy kiểm tra quyền StartFaceLivenessSession của vai trò Cognito dùng trên web.'
  if (error?.name === 'UnrecognizedClientException') return 'AWS không chấp nhận credential tạm thời. Hãy kiểm tra cấu hình Cognito Identity Pool và giờ hệ thống.'
  if (error?.name === 'SessionNotFoundException' || error?.name === 'ValidationException') {
    return 'Phiên xác minh không hợp lệ hoặc đã hết hạn. Vui lòng tạo phiên mới.'
  }
  if (state === 'CAMERA_ACCESS_ERROR' || state === 'DEFAULT_CAMERA_NOT_FOUND_ERROR') {
    return 'Không thể truy cập camera. Hãy kiểm tra quyền camera của trình duyệt rồi thử lại.'
  }
  if (state === 'CAMERA_FRAMERATE_ERROR') return 'Camera không đạt tốc độ hình ảnh cần thiết. Hãy đóng ứng dụng khác đang dùng camera rồi thử lại.'
  if (state === 'CONNECTION_TIMEOUT' || state === 'SERVER_ERROR') {
    return 'Không kết nối được tới AWS Rekognition. Hãy kiểm tra mạng và quyền StartFaceLivenessSession rồi thử lại.'
  }
  return `Quét khuôn mặt thất bại (${state}). Vui lòng thử lại.`
}

interface Props {
  purpose: 'ENROLLMENT' | 'EXAM_ENTRY'
  scheduleId?: string
  onPassed: (grantId?: string) => void
  onClose?: () => void
}

export default function FaceVerification({ purpose, scheduleId, onPassed, onClose }: Props) {
  const [session, setSession] = useState<FaceSession | null>(null)
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const [awaitingResult, setAwaitingResult] = useState(false)
  const [resultPending, setResultPending] = useState(false)
  const [failures, setFailures] = useState(0)
  const [cooldownUntil, setCooldownUntil] = useState<string | null>(null)
  const [requiresManualReview, setRequiresManualReview] = useState(false)
  const [now, setNow] = useState(0)

  useEffect(() => {
    if (purpose !== 'EXAM_ENTRY') return
    void studentFaceApi.profile().then((profile) => {
      setFailures(profile.failedAttemptsSinceSuccess)
      setCooldownUntil(profile.cooldownUntil)
      setRequiresManualReview(profile.requiresManualReview)
    }).catch(() => undefined)
  }, [purpose])

  useEffect(() => {
    const initialTimer = window.setTimeout(() => setNow(Date.now()), 0)
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => { window.clearTimeout(initialTimer); window.clearInterval(timer) }
  }, [])

  const remainingCooldown = cooldownUntil ? Math.max(0, Math.ceil((new Date(cooldownUntil).getTime() - now) / 1000)) : 0

  const abandonSession = () => {
    if (session) void studentFaceApi.cancel(session.id).catch(() => undefined)
    setSession(null)
    setResultPending(false)
  }

  const start = async () => {
    setError('')
    setResultPending(false)
    setWorking(true)
    try {
      setSession(await studentFaceApi.start(purpose, scheduleId))
    } catch {
      setError('Không thể mở phiên xác minh. Hãy kiểm tra kết nối hoặc thử lại sau.')
    } finally {
      setWorking(false)
    }
  }

  const complete = async () => {
    if (!session) return
    setWorking(true)
    setAwaitingResult(true)
    setResultPending(false)
    try {
      let result = await studentFaceApi.complete(session.id)
      for (let retry = 0; result.status === 'PROCESSING' && retry < 12; retry++) {
        await new Promise((resolve) => window.setTimeout(resolve, 1500))
        result = await studentFaceApi.complete(session.id)
      }
      if (result.status === 'PASSED') {
        onPassed(result.id)
        return
      }
      if (result.status === 'FAILED') {
        setFailures(result.failedAttemptsSinceSuccess)
        setCooldownUntil(result.cooldownUntil)
        setRequiresManualReview(result.requiresManualReview)
        setError(describeFailedVerification(result, purpose))
        setSession(null)
      } else {
        setError('Kết quả đang được xử lý. Bạn có thể kiểm tra lại mà không cần quét lại khuôn mặt.')
        setResultPending(true)
      }
    } catch {
      setError('Không thể hoàn tất xác minh. Vui lòng thử lại.')
      abandonSession()
    } finally {
      setWorking(false)
      setAwaitingResult(false)
    }
  }

  return (
    <section lang="vi" className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-[0_18px_50px_-32px_rgba(15,23,42,0.35)]">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-slate-50/70 px-5 py-5 sm:px-7">
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ScanFace size={23} aria-hidden="true" />
          </span>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-700">Bước xác minh</p>
            <h2 className="mt-1 text-lg font-bold text-slate-950 sm:text-xl">
              {purpose === 'ENROLLMENT' ? 'Đăng ký khuôn mặt' : 'Xác minh trước khi vào thi'}
            </h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {purpose === 'ENROLLMENT' ? 'Đặt mặt vào khung bầu dục để tạo hồ sơ lần đầu.' : 'Quét lại khuôn mặt để xác nhận đúng người dự thi.'}
            </p>
          </div>
        </div>
        {onClose && <button type="button" onClick={() => { abandonSession(); onClose() }}
          className="min-h-11 shrink-0 rounded-lg px-3 text-sm font-semibold text-slate-600 hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600">Đóng</button>}
      </div>

      <div className="space-y-5 p-5 sm:p-7">
        {!identityPoolId && <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">Chưa cấu hình AWS Cognito Identity Pool cho ứng dụng web.</p>}
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-800">{error}</p>}
        {purpose === 'EXAM_ENTRY' && !requiresManualReview && (
          <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            {failures < 3 ? `Lượt 1/2 · Còn ${3 - failures} lần thử.` : `Lượt 2/2 · Còn ${Math.max(0, 6 - failures)} lần thử.`}
          </p>
        )}
        {remainingCooldown > 0 && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Tạm khóa xác minh. Vui lòng chờ {remainingCooldown} giây.</p>}
        {requiresManualReview && <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">Cần giảng viên coi thi xác minh thủ công.</p>}

        {awaitingResult ? (
          <div role="status" className="flex min-h-48 items-center justify-center rounded-2xl bg-slate-50 p-6 text-center text-sm text-slate-600">
            Đang chờ kết quả xác minh từ AWS...
          </div>
        ) : session && resultPending ? (
          <div className="rounded-2xl bg-blue-50 p-5">
            <p className="text-sm leading-6 text-slate-700">Đã gửi phiên quét. Hãy kiểm tra kết quả trước khi tạo phiên mới.</p>
            <button type="button" onClick={() => void complete()} disabled={working} className="mt-4 min-h-11 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">Kiểm tra kết quả</button>
          </div>
        ) : session && identityPoolId ? (
          <div>
            <p className="mb-4 text-sm leading-6 text-slate-600">Đưa toàn bộ khuôn mặt vào khung bầu dục, di chuyển theo hướng dẫn và giữ yên khi được yêu cầu.</p>
            <div className="soes-face-detector overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <Suspense fallback={<p role="status" className="p-8 text-center text-sm text-slate-600">Đang mở camera...</p>}>
                <FaceLivenessPanel
                  key={session.id}
                  sessionId={session.providerSessionId}
                  region={session.region}
                  onAnalysisComplete={complete}
                  onError={(failure) => {
                    const metadata = failure.error as Error & { $metadata?: { httpStatusCode?: number } }
                    console.warn('Face Liveness failed', {
                      state: failure.state,
                      errorName: failure.error?.name,
                      httpStatusCode: metadata.$metadata?.httpStatusCode,
                    })
                    setError(describeLivenessError(failure))
                    abandonSession()
                  }}
                  onUserCancel={abandonSession}
                />
              </Suspense>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-5 sm:p-6">
            <p className="text-sm leading-6 text-slate-700">Cho phép dùng camera, nhìn thẳng vào màn hình và làm theo hướng dẫn trong khung quét.</p>
            <button type="button" disabled={!identityPoolId || working || remainingCooldown > 0 || requiresManualReview} onClick={() => void start()}
              className="mt-5 min-h-12 rounded-xl bg-blue-600 px-6 text-sm font-bold text-white shadow-sm hover:bg-blue-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-50">
              {working ? 'Đang chuẩn bị camera...' : 'Bắt đầu quét khuôn mặt'}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
