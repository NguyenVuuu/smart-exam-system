import { RefreshCw, ShieldAlert, X } from 'lucide-react'
import { useState } from 'react'
import type { ExamSubmission, ViolationRecord } from '../../types/teacher-exam.types'

export interface SubmissionViolationsModalProps {
  submission: ExamSubmission | null
  violations: ViolationRecord[]
  /** Violations từ ca gốc — chỉ truyền khi SV có cả 2 attempt */
  sourceViolations?: ViolationRecord[]
  onClose: () => void
  onViewEvidence: (url: string) => void
}

function ViolationList({
  violations,
  onViewEvidence,
}: {
  violations: ViolationRecord[]
  onViewEvidence: (url: string) => void
}) {
  if (violations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
        Không có vi phạm nào trong ca này.
      </div>
    )
  }
  return (
    <div className="space-y-3">
      {violations.map((violation) => (
        <div key={violation.id} className="rounded-xl border border-gray-100 bg-gray-50 p-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-900">{violation.type}</p>
              <p className="mt-1 text-xs text-gray-500">
                {new Date(violation.timestamp).toLocaleString('vi-VN')} - Mức độ {violation.severity}
              </p>
              {violation.note && (
                <p className="mt-2 text-sm text-gray-600">{violation.note}</p>
              )}
            </div>
            {violation.evidenceImageUrl && (
              <button
                type="button"
                onClick={() => onViewEvidence(violation.evidenceImageUrl!)}
                className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
              >
                Xem bằng chứng
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function SubmissionViolationsModal({
  submission,
  violations,
  sourceViolations,
  onClose,
  onViewEvidence,
}: SubmissionViolationsModalProps) {
  const hasBothCa = sourceViolations !== undefined
  const [activeTab, setActiveTab] = useState<'makeup' | 'source'>(hasBothCa ? 'makeup' : 'makeup')

  if (!submission) return null

  const totalCount = violations.length + (sourceViolations?.length ?? 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-700">
              <ShieldAlert size={20} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-gray-900">
                Vi phạm của {submission.studentName}
              </h3>
              <p className="text-sm text-gray-500">
                {submission.studentCode} · {totalCount} sự kiện tổng cộng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab bar — chỉ hiện khi có cả 2 ca */}
        {hasBothCa && (
          <div className="flex border-b border-gray-100 px-5">
            <button
              type="button"
              onClick={() => setActiveTab('makeup')}
              className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'makeup'
                  ? 'border-violet-500 text-violet-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <RefreshCw size={13} />
              Ca dự phòng
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === 'makeup' ? 'bg-violet-100 text-violet-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {violations.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('source')}
              className={`inline-flex items-center gap-1.5 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                activeTab === 'source'
                  ? 'border-rose-500 text-rose-700'
                  : 'border-transparent text-gray-500 hover:text-gray-900'
              }`}
            >
              <ShieldAlert size={13} />
              Ca gốc
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                activeTab === 'source' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {sourceViolations?.length ?? 0}
              </span>
            </button>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {hasBothCa ? (
            activeTab === 'makeup'
              ? <ViolationList violations={violations} onViewEvidence={onViewEvidence} />
              : <ViolationList violations={sourceViolations ?? []} onViewEvidence={onViewEvidence} />
          ) : (
            violations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
                Chưa tải được chi tiết vi phạm. Hãy mở tab Nhật ký vi phạm nếu cần xem toàn bộ lịch sử.
              </div>
            ) : (
              <ViolationList violations={violations} onViewEvidence={onViewEvidence} />
            )
          )}
        </div>
      </div>
    </div>
  )
}
