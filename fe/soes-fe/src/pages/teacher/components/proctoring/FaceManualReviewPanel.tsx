import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { approveFaceManualEntry, getPendingFaceManualReviews, type PendingFaceManualReview } from '../../api/teacher-exams.api'

interface Props {
  scheduleId: string
  refreshVersion: number
}

export default function FaceManualReviewPanel({ scheduleId, refreshVersion }: Props) {
  const [requests, setRequests] = useState<PendingFaceManualReview[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    let active = true
    void getPendingFaceManualReviews(scheduleId).then((items) => {
      if (active) { setRequests(items); setError(false) }
    }).catch(() => { if (active) setError(true) })
    return () => { active = false }
  }, [scheduleId, refreshVersion])

  const approve = async (studentId: string) => {
    if (reason.trim().length < 10 || submitting) return
    setSubmitting(true)
    try {
      await approveFaceManualEntry(scheduleId, studentId, reason.trim())
      setRequests((items) => items.filter((item) => item.studentId !== studentId))
      setSelectedId(null)
      setReason('')
      toast.success('Đã xác nhận. Sinh viên có 5 phút để vào bài thi.')
    } catch {
      toast.error('Không thể xác nhận. Hãy kiểm tra phân công coi thi và thử lại.')
    } finally {
      setSubmitting(false)
    }
  }

  return <div className="rounded-xl border border-gray-200 bg-white p-5">
    <h2 className="text-base font-semibold text-slate-900">Xác minh khuôn mặt thủ công</h2>
    <p className="mt-1 text-sm text-slate-600">Chỉ xác nhận sau khi đối chiếu trực tiếp danh tính sinh viên. Lý do và người xác nhận được lưu vào nhật ký.</p>
    {error && <p role="alert" className="mt-4 text-sm text-red-700">Không thể tải danh sách chờ xác minh.</p>}
    {!error && requests.length === 0 && <p className="mt-4 text-sm text-slate-500">Không có sinh viên cần xác minh thủ công.</p>}
    <div className="mt-4 space-y-3">
      {requests.map((item) => <div key={item.studentId} className="rounded-lg border border-gray-200 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-semibold text-slate-900">{item.studentName} · {item.studentCode}</p>
            <p className="text-xs text-slate-600">Xác minh tự động thất bại {item.failedAttempts} lần</p>
          </div>
          <button type="button" onClick={() => { setSelectedId(item.studentId); setReason('') }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Xem và xác nhận
          </button>
        </div>
        {selectedId === item.studentId && <div className="mt-4 space-y-3">
          <label htmlFor="face-manual-reason" className="block text-sm font-medium text-slate-700">Lý do xác nhận (ít nhất 10 ký tự)</label>
          <textarea id="face-manual-reason" value={reason} maxLength={500} rows={3}
            onChange={(event) => setReason(event.target.value)}
            className="w-full rounded-lg border border-gray-300 p-3 text-sm" placeholder="Mô tả cách đã kiểm tra danh tính trực tiếp" />
          <div className="flex gap-2">
            <button type="button" disabled={submitting || reason.trim().length < 10} onClick={() => void approve(item.studentId)}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{submitting ? 'Đang lưu...' : 'Xác nhận danh tính'}</button>
            <button type="button" disabled={submitting} onClick={() => setSelectedId(null)} className="rounded-lg px-4 py-2 text-sm text-slate-600">Hủy</button>
          </div>
        </div>}
      </div>)}
    </div>
  </div>
}
