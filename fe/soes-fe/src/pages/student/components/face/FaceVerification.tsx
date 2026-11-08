import { lazy, Suspense, useEffect, useState } from 'react'
import { studentFaceApi, type FaceSession } from '../../api/student-face.api'

const identityPoolId = import.meta.env.VITE_AWS_FACE_IDENTITY_POOL_ID as string | undefined
const FaceLivenessPanel = lazy(() => import('./FaceLivenessPanel'))

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
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (purpose !== 'EXAM_ENTRY') return
    void studentFaceApi.profile().then((profile) => {
      setFailures(profile.failedAttemptsSinceSuccess)
      setCooldownUntil(profile.cooldownUntil)
      setRequiresManualReview(profile.requiresManualReview)
    }).catch(() => undefined)
  }, [purpose])

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const remainingCooldown = cooldownUntil ? Math.max(0, Math.ceil((new Date(cooldownUntil).getTime() - now) / 1000)) : 0

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
        setError(result.requiresManualReview
          ? 'Xác minh nhiều lần chưa thành công. Vui lòng liên hệ giảng viên coi thi.'
          : 'Khuôn mặt chưa khớp hoặc chưa đạt kiểm tra. Vui lòng thử lại.')
      } else {
        setError('Hệ thống chưa nhận được kết quả. Vui lòng thử lại sau.')
      }
      setSession(null)
    } catch {
      setError('Không thể hoàn tất xác minh. Vui lòng thử lại.')
      setSession(null)
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
        {onClose && <button type="button" onClick={onClose} className="text-sm text-slate-600">Đóng</button>}
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
              identityPoolId={identityPoolId}
              sessionId={session.providerSessionId}
              region={session.region}
              onAnalysisComplete={complete}
              onError={() => { setError('Camera hoặc kết nối xác minh gặp lỗi. Vui lòng thử lại.'); setSession(null) }}
              onUserCancel={() => setSession(null)}
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
