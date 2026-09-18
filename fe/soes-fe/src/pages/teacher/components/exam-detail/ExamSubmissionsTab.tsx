import { Eye } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import { formatSessionRange } from '../../../../utils/date.utils'
import type { ExamSchedule, ExamSubmission, ResultReleaseMode } from '../../types/teacher-exam.types'

export function ExamSubmissionsTab({
  submissions,
  sessions,
  selectedSessionId,
  onSessionChange,
  resultReleaseText,
  resultReleaseMode,
  resultReleaseAt,
  isResultsPublished,
  onResultReleaseModeChange,
  onResultReleaseAtChange,
  onResultsPublishedChange,
  onViewSubmission,
  loading,
  pagination,
  onPageChange,
  canReview = true,
  showSessionSelector = true,
  unavailableTitle = 'Ca thi chưa kết thúc',
  unavailableDescription = 'Bài nộp và kết quả chỉ được mở sau khi ca thi kết thúc.',
}: {
  submissions: ExamSubmission[]
  sessions: ExamSchedule[]
  selectedSessionId: string
  onSessionChange: (sessionId: string) => void
  resultReleaseText: string
  resultReleaseMode: ResultReleaseMode
  resultReleaseAt: string
  isResultsPublished: boolean
  onResultReleaseModeChange: (mode: ResultReleaseMode) => void
  onResultReleaseAtChange: (value: string) => void
  onResultsPublishedChange: (value: boolean) => void
  onViewSubmission: (submission: ExamSubmission) => void
  loading: boolean
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  onPageChange: (page: number) => void
  canReview?: boolean
  showSessionSelector?: boolean
  unavailableTitle?: string
  unavailableDescription?: string
}) {
  const columns: ColumnDef<ExamSubmission>[] = [
    {
      header: 'STT',
      width: '60px',
      align: 'center',
      render: (_, idx) => <span className="text-sm text-gray-400">{idx + 1}</span>,
    },
    {
      header: 'MSSV',
      width: '130px',
      render: (s) => <span className="text-sm font-semibold text-blue-600">{s.studentCode}</span>,
    },
    {
      header: 'Họ và Tên',
      width: '200px',
      className: 'whitespace-nowrap',
      render: (s) => <span className="whitespace-nowrap text-sm font-bold text-gray-900">{s.studentName}</span>,
    },
    {
      header: 'Thời Gian Nộp',
      width: '160px',
      render: (s) => <span className="text-sm font-medium text-gray-600">{s.submittedAt}</span>,
    },
    {
      header: 'Điểm Trước Phúc Khảo',
      width: '160px',
      align: 'center',
      render: (s) => <span className="text-sm font-medium text-gray-700">{s.autoScore === null ? '-' : `${s.autoScore}đ`}</span>,
    },
    {
      header: 'Điểm Sau Phúc Khảo',
      width: '160px',
      align: 'center',
      render: (s) =>
        s.regradeRequest?.status === 'RESOLVED' && s.manualScoreOverride != null ? (
          <span className="rounded-lg bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900">
            {s.manualScoreOverride}đ
          </span>
        ) : (
          <span className="text-sm text-gray-400">-</span>
        ),
    },
    {
      header: 'Điểm Chốt',
      width: '120px',
      align: 'center',
      render: (s) => <span className="text-sm font-bold text-gray-900">{s.finalScore === null ? '-' : `${s.finalScore}đ`}</span>,
    },
    {
      header: 'Phúc Khảo',
      width: '140px',
      align: 'center',
      render: (s) => {
        if (!s.regradeRequest) return <span className="text-sm text-gray-400">-</span>
        const labels = {
          PENDING: 'Chờ xử lý',
          IN_REVIEW: 'Đang xử lý',
          RESOLVED: 'Đã xử lý',
          REJECTED: 'Đã từ chối',
        }
        const tones = {
          PENDING: 'blue',
          IN_REVIEW: 'amber',
          RESOLVED: 'emerald',
          REJECTED: 'rose',
        } as const
        return (
          <AppBadge tone={tones[s.regradeRequest.status]} className="px-2.5 py-1 text-xs font-semibold">
            {labels[s.regradeRequest.status]}
          </AppBadge>
        )
      },
    },
    {
      header: 'Thao tác',
      width: '88px',
      align: 'right',
      render: (submission) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onViewSubmission(submission)}
            title="Xem bài làm"
            aria-label={`Xem bài làm của ${submission.studentName}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 transition-colors hover:bg-blue-100"
          >
            <Eye size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {showSessionSelector && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-base font-semibold text-gray-900">Ca thi đang xem</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Bài nộp, điểm trước và sau phúc khảo được theo dõi theo từng ca thi.
            </p>
          </div>
          <AppSelect
            value={selectedSessionId}
            onChange={onSessionChange}
            className="w-full sm:w-96"
            buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm"
            options={sessions.map((session) => ({
              value: session.id,
              label: `${session.courseCode} • ${formatSessionRange(session.startTime, session.endTime)}`,
            }))}
          />
        </div>
      )}

      {!canReview && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-900">{unavailableTitle}</p>
          <p className="mt-1 text-sm text-gray-500">{unavailableDescription}</p>
        </div>
      )}

      {canReview && (
        <>
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
            <div className="space-y-0.5">
              <p className="text-base font-semibold text-gray-900">Cấu hình hiển thị điểm</p>
              <p className="text-sm text-gray-500">{resultReleaseText}</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3">
              <AppSelect
                value={resultReleaseMode}
                onChange={onResultReleaseModeChange}
                className="w-56"
                buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm font-medium"
                options={[
                  { value: 'IMMEDIATE', label: 'Hiện điểm ngay' },
                  { value: 'MANUAL', label: 'Ẩn điểm / công bố sau' },
                  { value: 'SCHEDULED', label: 'Hẹn giờ công bố' },
                ]}
              />

              {resultReleaseMode === 'SCHEDULED' && (
                <input
                  type="datetime-local"
                  value={resultReleaseAt}
                  onChange={(e) => onResultReleaseAtChange(e.target.value)}
                  className="rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-sm font-medium text-gray-800 focus:border-blue-500 focus:outline-none"
                />
              )}

              {resultReleaseMode === 'MANUAL' && (
                <button
                  onClick={() => onResultsPublishedChange(!isResultsPublished)}
                  className={`rounded-xl px-4 py-2.5 text-sm font-semibold shadow-xs transition-colors ${
                    isResultsPublished
                      ? 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      : 'bg-emerald-600 text-white hover:bg-emerald-700'
                  }`}
                >
                  {isResultsPublished ? 'Ẩn bảng điểm ngay' : 'Công bố bảng điểm ngay'}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <DataTable
              columns={columns}
              data={submissions}
              keyExtractor={(s) => s.id}
              emptyText="Chưa có sinh viên nào nộp bài trong ca thi này"
              pageSize={10}
              isLoading={loading}
              page={pagination.page}
              totalItems={pagination.totalItems}
              totalPages={pagination.totalPages}
              onPageChange={onPageChange}
            />
          </div>
        </>
      )}
    </div>
  )
}
