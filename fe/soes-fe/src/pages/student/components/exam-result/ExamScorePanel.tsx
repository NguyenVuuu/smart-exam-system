import { AlertTriangle, BookOpen, HelpCircle, Info, Wrench, X } from 'lucide-react'
import { useState } from 'react'
import type { AttemptResult } from '../../api/student-take-exam.api'

const pendingMessages: Record<AttemptResult['reason'], string> = {
  AVAILABLE: '',
  GRADING: 'Bài làm đang được chấm. Điểm sẽ hiển thị khi hoàn tất.',
  PENDING_RELEASE: 'Điểm chưa được công bố theo cấu hình của ca thi.',
  NEVER: 'Ca thi này không công bố điểm cho sinh viên.',
}

const ADJUSTMENT_TYPE_LABELS: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  SYSTEM_ERROR: { label: 'Hệ thống chấm sai', icon: <Wrench size={13} />, color: 'text-blue-700 bg-blue-50 border-blue-200' },
  VIOLATION:    { label: 'Gian lận (có bằng chứng)', icon: <AlertTriangle size={13} />, color: 'text-red-700 bg-red-50 border-red-200' },
  MANUAL_REVIEW:{ label: 'Chấm tay / Lập trình', icon: <BookOpen size={13} />, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  GRADE_APPEAL: { label: 'Phúc khảo', icon: <HelpCircle size={13} />, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  OTHER:        { label: 'Lý do khác', icon: <HelpCircle size={13} />, color: 'text-gray-700 bg-gray-50 border-gray-200' },
}

function formatDateTime(value: string | null) {
  return value ? new Date(value).toLocaleString('vi-VN') : null
}

export default function ExamScorePanel({ result }: { result: AttemptResult }) {
  if (!result.available) {
    const releaseAt = result.reason === 'PENDING_RELEASE' && result.releaseMode === 'SCHEDULED'
      ? formatDateTime(result.releaseAt)
      : null
    return (
      <div className="rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
        {releaseAt ? `Điểm sẽ được công bố lúc ${releaseAt}.` : pendingMessages[result.reason]}
      </div>
    )
  }

  const adjustments = result.scoreAdjustments ?? []

  return (
    <div className="space-y-3">
      {/* Điểm chính */}
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-emerald-700">Điểm bài thi</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-900">
            {result.score} / {result.maxScore}
          </p>
        </div>
        {adjustments.length > 0 && (
          <ScoreAdjustmentButton adjustments={adjustments} />
        )}
      </div>
    </div>
  )
}

type ScoreAdjustmentItem = AttemptResult['scoreAdjustments'][number]

function ScoreAdjustmentButton({ adjustments }: { adjustments: ScoreAdjustmentItem[] }) {
  const [open, setOpen] = useState(false)
  const [detail, setDetail] = useState<ScoreAdjustmentItem | null>(null)

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors shrink-0">
        <Info size={13} /> Xem lịch sử điểm ({adjustments.length})
      </button>

      {/* Modal danh sách */}
      {open && !detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Lịch sử điều chỉnh điểm</h3>
              <button onClick={() => setOpen(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-2">
              {adjustments.map((adj) => {
                const meta = ADJUSTMENT_TYPE_LABELS[adj.adjustmentType] ?? ADJUSTMENT_TYPE_LABELS.OTHER
                return (
                  <div key={adj.id} className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
                    <div className="min-w-0">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${meta.color}`}>
                        {meta.icon}{meta.label}
                      </span>
                      <p className="mt-1 text-xs text-gray-500">
                        Điểm chốt: <span className="font-semibold text-gray-800">{adj.newScore}đ</span>
                        <span className="ml-2 text-gray-400">· {formatDateTime(adj.adjustedAt)}</span>
                      </p>
                    </div>
                    <button type="button" onClick={() => setDetail(adj)}
                      className="shrink-0 rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-100">
                      Chi tiết
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal chi tiết */}
      {detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Chi tiết điều chỉnh điểm</h3>
              <button onClick={() => setDetail(null)} className="rounded-lg p-1 hover:bg-gray-100">
                <X size={16} />
              </button>
            </div>

            {(() => {
              const meta = ADJUSTMENT_TYPE_LABELS[detail.adjustmentType] ?? ADJUSTMENT_TYPE_LABELS.OTHER
              return (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold ${meta.color}`}>
                      {meta.icon}{meta.label}
                    </span>
                    <span className="text-sm text-gray-700">
                      Điểm chốt: <span className="font-bold text-gray-900">{detail.newScore}đ</span>
                    </span>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3 text-sm text-gray-700 leading-relaxed">
                    {detail.reason}
                  </div>
                  <p className="text-xs text-gray-400">
                    Điều chỉnh bởi <span className="font-medium text-gray-600">{detail.adjustedBy}</span> lúc {formatDateTime(detail.adjustedAt)}
                  </p>
                  {detail.evidenceUrls.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs text-gray-500 font-medium">Bằng chứng đính kèm:</p>
                      <div className="flex flex-wrap gap-2">
                        {detail.evidenceUrls.map((url, i) => (
                          <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                            className="block overflow-hidden rounded-lg border border-gray-200 hover:border-amber-400 transition-colors"
                            style={{ width: 72, height: 72 }}>
                            <img src={url} alt={`Bằng chứng ${i + 1}`} className="h-full w-full object-cover" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  <button type="button" onClick={() => setDetail(null)}
                    className="w-full rounded-xl border border-gray-200 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50">
                    ← Quay lại danh sách
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </>
  )
}
