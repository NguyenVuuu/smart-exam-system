import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getStudentEnrollmentImage, revokeStudentFace } from '../../api/admin-management.api'
import type { AdminUser } from '../../types/admin.types'

export default function StudentFaceEnrollmentSection({ user, studentId, onChanged }: {
  user: AdminUser
  studentId: string
  onChanged: () => Promise<void>
}) {
  const [viewing, setViewing] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const face = user.faceEnrollment

  useEffect(() => {
    if (!viewing || !face?.imageAvailable) return
    let active = true
    let objectUrl: string | null = null
    void getStudentEnrollmentImage(studentId).then((blob) => {
      if (!active) return
      objectUrl = URL.createObjectURL(blob)
      setImageUrl(objectUrl)
    }).catch(() => { if (active) setImageError(true) })
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [viewing, face?.imageAvailable, studentId])

  const revoke = async () => {
    if (busy || reason.trim().length < 10) return
    setBusy(true)
    setViewing(false)
    try {
      await revokeStudentFace(studentId, reason.trim())
      toast.success('Đã thu hồi khuôn mặt. Sinh viên có thể đăng ký lại.')
    } catch {
      toast.error('Không thể hoàn tất thu hồi. Nếu hồ sơ đang thu hồi, hãy thử lại để xóa Face ID trên AWS.')
    } finally {
      setBusy(false)
      await onChanged()
    }
  }

  return <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
    <h3 className="text-sm font-semibold text-slate-900">Đăng ký khuôn mặt</h3>
    <p className="mt-1 text-sm text-slate-600">
      {face?.status === 'ACTIVE' ? `Đã đăng ký${face.enrolledAt ? ` lúc ${new Date(face.enrolledAt).toLocaleString('vi-VN')}` : ''}.`
        : face?.cleanupPending ? 'Đang thu hồi: cần hoàn tất xóa Face ID trên AWS.'
          : face?.status === 'REVOKED' ? 'Đã thu hồi. Sinh viên có thể đăng ký lại.' : 'Sinh viên chưa đăng ký khuôn mặt.'}
    </p>
    {face?.status === 'ACTIVE' && face.imageAvailable && <button type="button" className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
      onClick={() => { setImageError(false); setImageUrl(null); setViewing((value) => !value) }}>
      {viewing ? 'Ẩn ảnh đăng ký' : 'Xem ảnh đăng ký'}
    </button>}
    {viewing && <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
      {imageUrl ? <img src={imageUrl} alt="Ảnh khuôn mặt đã đăng ký" className="h-56 w-full object-contain" />
        : <p className="text-sm text-slate-600">{imageError ? 'Không tải được ảnh đăng ký.' : 'Đang tải ảnh...'}</p>}
    </div>}
    {(face?.status === 'ACTIVE' || face?.cleanupPending) && <div className="mt-4 border-t border-slate-200 pt-3">
      {!confirming ? <button type="button" className="text-sm font-semibold text-rose-700 hover:underline" onClick={() => setConfirming(true)}>
        {face.cleanupPending ? 'Thử hoàn tất thu hồi' : 'Thu hồi khuôn mặt'}
      </button> : <div className="space-y-2">
        <p className="text-sm text-rose-800">Chỉ thu hồi sau khi đã kiểm tra danh tính sinh viên. Phiên xác minh chưa sử dụng sẽ hết hiệu lực.</p>
        <label htmlFor="face-revoke-reason" className="block text-sm font-medium text-slate-700">Lý do thu hồi (ít nhất 10 ký tự)</label>
        <textarea id="face-revoke-reason" value={reason} onChange={(event) => setReason(event.target.value)}
          maxLength={500} rows={2} className="w-full rounded-lg border border-slate-300 bg-white p-2 text-sm" />
        <div className="flex gap-2">
          <button type="button" disabled={busy || reason.trim().length < 10} onClick={() => void revoke()}
            className="rounded-lg bg-rose-700 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            {busy ? 'Đang thu hồi...' : 'Xác nhận thu hồi'}
          </button>
          <button type="button" disabled={busy} onClick={() => { setConfirming(false); setReason('') }} className="px-3 py-2 text-sm text-slate-600">Hủy</button>
        </div>
      </div>}
    </div>}
  </section>
}
