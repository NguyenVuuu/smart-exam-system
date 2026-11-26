import { useState } from 'react'
import { ADJUSTMENT_TYPE_OPTIONS, type ChangedItem } from './score-adjustment-options'
import { MessageSquare, CheckCircle2, ChevronLeft, ChevronRight, AlertTriangle } from 'lucide-react'

export function BulkReasonsModal({
  initialItems,
  totalPending,
  saving,
  violationsByStudentId,
  onConfirm,
  onClose,
}: {
  initialItems: ChangedItem[];
  totalPending: number;
  saving: boolean;
  violationsByStudentId: Record<string, Array<{ id: string; evidenceImageUrl: string }>>;
  onConfirm: (items: ChangedItem[]) => void;
  onClose: () => void;
}) {
  const [items, setItems] = useState<ChangedItem[]>(initialItems);
  const [cursor, setCursor] = useState(0);

  const current = items[cursor]!;
  const allFilled = items.every((i) => i.reason.trim().length >= 5 && i.adjustmentType);

  const updateField = (field: keyof ChangedItem, value: unknown) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === cursor ? { ...item, [field]: value } : item))
    );
  };

  const systemEvidences = violationsByStudentId[current.submission.studentId] ?? []
  const showEvidencePicker = current.adjustmentType === 'VIOLATION'

  const toggleSystemEvidence = (id: string) => {
    const exists = current.violationIds.includes(id)
    updateField('violationIds', exists
      ? current.violationIds.filter((v) => v !== id)
      : [...current.violationIds, id]
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="mb-1 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">Điền lý do điều chỉnh điểm</h3>
              <p className="text-xs text-gray-400">
                {items.length} sinh viên có điểm chốt khác điểm hệ thống
              </p>
            </div>
          </div>
          {/* Phân trang */}
          <div className="flex items-center gap-1 shrink-0">
            <button type="button" onClick={() => setCursor((c) => c - 1)} disabled={cursor === 0}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <ChevronLeft size={14} />
            </button>
            <span className="min-w-[3rem] text-center text-xs font-semibold text-gray-600">
              {cursor + 1} / {items.length}
            </span>
            <button type="button" onClick={() => setCursor((c) => c + 1)} disabled={cursor === items.length - 1}
              className="flex h-7 w-7 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Thông tin sinh viên */}
        <div className="my-3 rounded-xl bg-amber-50 border border-amber-100 px-4 py-3">
          <p className="text-sm font-bold text-gray-900">{current.submission.studentName}</p>
          <p className="text-xs text-gray-500 mt-0.5">{current.submission.studentCode}</p>
          <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
            <span className="text-gray-500">Điểm hệ thống: <span className="text-gray-800">{current.submission.autoScore ?? 0}đ</span></span>
            <span className="text-gray-300">→</span>
            <span className="text-amber-700">Điểm chốt: {current.score}đ</span>
          </div>
        </div>

        {/* Loại lý do */}
        <div className="mb-3">
          <label className="mb-1.5 block text-sm font-semibold text-gray-700">
            Loại điều chỉnh <span className="text-rose-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
            {ADJUSTMENT_TYPE_OPTIONS.map((opt) => (
              <button key={opt.value} type="button"
                onClick={() => updateField('adjustmentType', opt.value)}
                className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition-colors ${
                  current.adjustmentType === opt.value
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
          <textarea key={cursor} value={current.reason}
            onChange={(e) => updateField('reason', e.target.value)}
            rows={2} maxLength={500}
            placeholder="Nhập lý do (ít nhất 5 ký tự)..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm text-gray-900 outline-none focus:border-amber-400 focus:bg-white" />
          <div className="mt-1 flex items-center justify-between">
            <span className={`text-xs ${current.reason.trim().length >= 5 ? "text-emerald-600" : "text-gray-400"}`}>
              {current.reason.trim().length >= 5 ? "✓ Đã điền" : "Cần ít nhất 5 ký tự"}
            </span>
            <span className="text-xs text-gray-400">{current.reason.length}/500</span>
          </div>
        </div>

        {/* Khu vực bằng chứng khi là VIOLATION */}
        {showEvidencePicker && systemEvidences.length > 0 && (
          <div className="mb-3 space-y-2 rounded-xl bg-red-50 border border-red-100 p-3">
            <p className="text-xs font-semibold text-red-700 flex items-center gap-1.5">
              <AlertTriangle size={12} /> Chọn ảnh bằng chứng từ hệ thống (tùy chọn)
            </p>
            <div className="flex flex-wrap gap-2">
              {systemEvidences.map((v) => (
                <button key={v.id} type="button" onClick={() => toggleSystemEvidence(v.id)}
                  className={`relative overflow-hidden rounded-lg border-2 transition-all ${
                    current.violationIds.includes(v.id) ? 'border-amber-400' : 'border-gray-200'
                  }`} style={{ width: 64, height: 64 }}>
                  <img src={v.evidenceImageUrl} alt="Vi phạm" className="h-full w-full object-cover" />
                  {current.violationIds.includes(v.id) && (
                    <div className="absolute inset-0 flex items-center justify-center bg-amber-400/30">
                      <CheckCircle2 size={16} className="text-amber-600" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tiến độ */}
        <div className="mb-4 flex gap-1">
          {items.map((item, idx) => (
            <button key={idx} type="button" onClick={() => setCursor(idx)}
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                item.reason.trim().length >= 5 && item.adjustmentType
                  ? "bg-emerald-400"
                  : idx === cursor ? "bg-amber-400" : "bg-gray-200"
              }`} title={item.submission.studentName} />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button type="button" onClick={onClose} disabled={saving}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Hủy
          </button>
          <button type="button" onClick={() => onConfirm(items)} disabled={saving || !allFilled}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            title={!allFilled ? "Vui lòng điền đầy đủ cho tất cả sinh viên" : undefined}>
            {saving ? "Đang chốt..." : `Chốt cả ca (${totalPending} bài)`}
          </button>
        </div>
      </div>
    </div>
  );
}
