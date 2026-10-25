import { ShieldAlert, X } from 'lucide-react'
import type { ExamSubmission, ViolationRecord } from '../../types/teacher-exam.types'

export interface SubmissionViolationsModalProps {
  submission: ExamSubmission | null
  violations: ViolationRecord[]
  onClose: () => void
  onViewEvidence: (url: string) => void
}

export default function SubmissionViolationsModal({
  submission,
  violations,
  onClose,
  onViewEvidence,
}: SubmissionViolationsModalProps) {
  if (!submission) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
      <div className="flex max-h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
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
                {submission.studentCode} - {submission.violationCount} sự kiện
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

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {violations.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center text-sm text-gray-500">
              Chưa tải được chi tiết vi phạm. Hãy mở tab Nhật ký vi phạm nếu cần xem toàn bộ lịch sử.
            </div>
          ) : (
            <div className="space-y-3">
              {violations.map((violation) => (
                <div
                  key={violation.id}
                  className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                >
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
          )}
        </div>
      </div>
    </div>
  )
}
