import { Edit, Eye } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { ExamSchedule, ExamSubmission, ResultReleaseMode } from '../../types/teacher-exam.types'
import { formatSessionRange } from '../../../../utils/date.utils'

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
  onEditSubmission,
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
  onEditSubmission: (submission: ExamSubmission) => void
}) {
  const columns: ColumnDef<ExamSubmission>[] = [
    {
      header: 'STT',
      width: '60px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400 text-sm">{idx + 1}</span>,
    },
    {
      header: 'MSSV',
      width: '130px',
      render: (s) => <span className="text-blue-600 font-semibold text-sm">{s.studentCode}</span>,
    },
    {
      header: 'Họ và Tên',
      render: (s) => <span className="font-bold text-gray-900 text-sm">{s.studentName}</span>,
    },
    {
      header: 'Thời Gian Nộp',
      width: '160px',
      render: (s) => <span className="text-gray-600 text-sm font-medium">{s.submittedAt}</span>,
    },
    {
      header: 'Chấm Tự Động',
      width: '130px',
      align: 'center',
      render: (s) => <span className="text-gray-700 text-sm font-medium">{s.autoScore}đ</span>,
    },
    {
      header: 'Ghi Đè Thủ Công',
      width: '150px',
      align: 'center',
      render: (s) =>
        s.manualScoreOverride !== undefined ? (
          <span className="px-3 py-1 bg-amber-100 text-amber-900 rounded-lg text-sm font-bold">
            {s.manualScoreOverride}đ
          </span>
        ) : (
          <span className="text-gray-400 text-sm">-</span>
        ),
    },
    {
      header: 'Điểm Chốt',
      width: '120px',
      align: 'center',
      render: (s) => <span className="font-bold text-gray-900 text-sm">{s.finalScore}đ</span>,
    },
    {
      header: 'Phúc Khảo',
      width: '140px',
      align: 'center',
      render: (s) => {
        if (!s.regradeRequest) return <span className="text-gray-400 text-sm">-</span>
        const labels = {
          SUBMITTED: 'Đã gửi',
          IN_REVIEW: 'Đang xem xét',
          ACCEPTED: 'Đã chấp nhận',
          REJECTED: 'Đã từ chối',
          CLOSED: 'Đã đóng',
        }
        const tones = {
          SUBMITTED: 'blue',
          IN_REVIEW: 'amber',
          ACCEPTED: 'emerald',
          REJECTED: 'rose',
          CLOSED: 'gray',
        } as const
        return (
          <AppBadge tone={tones[s.regradeRequest.status]} className="text-xs font-semibold px-2.5 py-1">
            {labels[s.regradeRequest.status]}
          </AppBadge>
        )
      },
    },
    {
      header: 'Thao Tác',
      width: '140px',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onViewSubmission(s)}
            title="Xem lại bài làm"
            className="w-9 h-9 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors inline-flex items-center justify-center shadow-2xs"
          >
            <Eye size={17} />
          </button>
          <button
            onClick={() => onEditSubmission(s)}
            title="Sửa điểm phúc khảo"
            className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors inline-flex items-center justify-center shadow-2xs"
          >
            <Edit size={17} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-gray-100 bg-white p-5 shadow-sm gap-3">
        <div>
          <p className="text-base font-semibold text-gray-900">Ca thi đang xem</p>
          <p className="text-sm text-gray-500 mt-0.5">
            Bài nộp và chính sách công bố được quản lý riêng theo từng ca.
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

      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
              className="bg-gray-50 border border-gray-200 text-sm font-medium rounded-xl px-3.5 py-2 text-gray-800 focus:outline-none focus:border-blue-500"
            />
          )}

          {resultReleaseMode === 'MANUAL' && (
            <button
              onClick={() => onResultsPublishedChange(!isResultsPublished)}
              className={`px-4 py-2.5 font-semibold text-sm rounded-xl transition-colors shadow-xs ${
                isResultsPublished
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
              }`}
            >
              {isResultsPublished ? 'Ẩn bảng điểm ngay' : 'Công bố bảng điểm ngay'}
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={submissions}
          keyExtractor={(s) => s.id}
          emptyText="Chưa có sinh viên nào nộp bài trong ca thi này"
          pageSize={10}
        />
      </div>
    </div>
  )
}
