import { useState } from 'react'
import { ADJUSTMENT_TYPE_OPTIONS, type AdjustmentType } from './score-adjustment-options'
import { MessageSquare, CheckCircle2, AlertTriangle } from 'lucide-react'
import type { ExamSubmission } from '../../types/teacher-exam.types'

export function ReasonModal({
  submission,
  score,
  saving,
  violationEvidences,
  onConfirm,
  onClose,
}: {
  submission: ExamSubmission
  score: number
  saving: boolean
  violationEvidences: Array<{ id: string; evidenceImageUrl: string }>
  onConfirm: (reason: string, adjustmentType: AdjustmentType, evidenceUrls: string[], violationIds: string[]) => void
  onClose: () => void
}) {
  const [reason, setReason] = useState('')
  const [adjustmentType, setAdjustmentType] = useState<AdjustmentType>('OTHER')
  const [selectedViolationIds, setSelectedViolationIds] = useState<string[]>([])

  const showEvidencePicker = adjustmentType === 'VIOLATION'
  const canSubmit = reason.trim().length >= 5 && adjustmentType

  const toggleViolation = (id: string) => {
    setSelectedViolationIds((prev) => prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="mb-4 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <MessageSquare size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">Điểm chốt khác điểm hệ thống</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              <span className="font-semibold text-gray-800">{submission.studentName}</span>
              {' '}— Điểm hệ thống: <span className="font-semibold">{submission.autoScore ?? 0}đ</span>
              {' '}→ Điểm chốt: <span className="font-semibold text-amber-700">{score}đ</span>
            </p>
          </div>
        </div>

        {/* Loại điều chỉnh */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Loại điều chỉnh <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {ADJUSTMENT_TYPE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => setAdjustmentType(opt.value)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
                  adjustmentType === opt.value
                    ? 'border-amber-400 bg-amber-50 text-amber-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}>
                <opt.icon size={14} />{opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Ô lý do */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Mô tả chi tiết <span className="text-rose-500">*</span>
          </label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)}
            rows={3} maxLength={500}
            placeholder="Nhập lý do điều chỉnh điểm (ít nhất 5 ký tự)..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-amber-400 focus:bg-white"
            autoFocus />
          <p className="mt-1 text-right text-xs text-gray-400">{reason.length}/500</p>
        </div>

        {/* Khu vực bằng chứng — chỉ hiện khi chọn VIOLATION */}
        {showEvidencePicker && violationEvidences.length > 0 && (
          <div className="mb-4 space-y-2 rounded-xl bg-red-50 border border-red-100 p-3">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Chọn ảnh bằng chứng từ hệ thống (tùy chọn)
            </p>
            <div className="flex flex-wrap gap-2">
              {violationEvidences.map((v) => (
                <button key={v.id} type="button" onClick={() => toggleViolation(v.id)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    selectedViolationIds.includes(v.id) ? 'border-amber-400' : 'border-gray-200'
                  }`} style={{ width: 72, height: 72 }}>
                  <img src={v.evidenceImageUrl} alt="Vi phạm" className="h-full w-full object-cover" />
                  {selectedViolationIds.includes(v.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-400/30">
                      <CheckCircle2 size={20} className="text-amber-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Hủy
          </button>
          <button type="button"
            onClick={() => onConfirm(reason.trim(), adjustmentType, [], selectedViolationIds)}
            disabled={saving || !canSubmit}
            className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50">
            {saving ? "Đang chốt..." : "Xác nhận chốt điểm"}
          </button>
        </div>
      </div>
    </div>
  )
}
