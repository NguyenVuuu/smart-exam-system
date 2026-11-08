import { lazy, Suspense, useEffect, useState } from 'react'
import type { FaceLivenessDetectorProps } from '@aws-amplify/ui-react-liveness'
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
    return `Phiên quét chưa đạt kiểm tra người thật. ${guidance || 'Hãy quét lại ở nơi đủ sáng, nhìn thẳng camera và không che mặt.'}`
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
  }

  const start = async () => {
    setError('')
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
        setError('Hệ thống chưa nhận được kết quả. Vui lòng thử lại sau.')
        abandonSession()
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
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-slate-900">
          {purpose === 'ENROLLMENT' ? 'Đăng ký khuôn mặt' : 'Xác minh khuôn mặt trước khi vào thi'}
        </h2>
        {onClose && <button type="button" onClick={() => { abandonSession(); onClose() }} className="text-sm text-slate-600">Đóng</button>}
      </div>
      <p className="text-sm text-slate-600">Cho phép sử dụng camera và làm theo hướng dẫn trên màn hình.</p>
      {!identityPoolId && <p role="alert" className="text-sm text-red-700">Chưa cấu hình AWS Cognito Identity Pool cho ứng dụng web.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {purpose === 'EXAM_ENTRY' && failures > 0 && !requiresManualReview && (
        <p className="text-sm text-slate-600">Còn {Math.max(0, 6 - failures)} lần thử trước khi cần giảng viên coi thi xác nhận.</p>
      )}
      {remainingCooldown > 0 && <p className="text-sm text-amber-700">Tạm khóa xác minh. Vui lòng chờ {remainingCooldown} giây.</p>}
      {requiresManualReview && <p className="text-sm text-amber-700">Cần giảng viên coi thi xác minh thủ công.</p>}
      {awaitingResult ? (
        <p role="status" className="text-sm text-slate-600">Đang chờ kết quả xác minh từ AWS...</p>
      ) : session && identityPoolId ? (
        <div className="mx-auto max-w-xl">
          <Suspense fallback={<p className="text-sm text-slate-600">Đang mở camera...</p>}>
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
      ) : (
        <button type="button" disabled={!identityPoolId || working || remainingCooldown > 0 || requiresManualReview} onClick={() => void start()}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
          {working ? 'Đang xử lý...' : 'Bắt đầu quét khuôn mặt'}
        </button>
      )}
    </div>
  )
}
