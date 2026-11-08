import { Eye, ExternalLink, ShieldAlert, ClipboardCheck, ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import { formatSessionRange } from '../../../../utils/date.utils'
import type { ExamSchedule, ExamSubmission } from '../../types/teacher-exam.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null) return <span className="text-sm text-gray-400">—</span>
  return <span className="text-sm font-semibold text-gray-800">{score}đ</span>
}

// ── GradingBanner — hiển thị link sang trang chấm điểm ──────────────────────

function GradingBanner({
  session,
  examId,
}: {
  session: ExamSchedule | null | undefined
  examId: string
}) {
  const navigate = useNavigate()
  const [selectedCourseId, setSelectedCourseId] = useState<string>(
    session?.courseOfferingId ?? '',
  )

  if (!session) return null

  const courseOptions = session.courseOfferings ?? [
    { id: session.courseOfferingId, code: session.courseCode },
  ]

  // Lọc bỏ entry rỗng
  const validOptions = courseOptions.filter((c) => c.id)

  if (validOptions.length === 0) return null

  const activeCourseId = selectedCourseId || validOptions[0]?.id || ''
  const gradingUrl = activeCourseId
    ? `/teacher/courses/${activeCourseId}/exams/${examId}/submissions?scheduleId=${encodeURIComponent(session.id)}`
    : null

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-blue-100 bg-blue-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
          <ClipboardCheck size={20} />
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-900">
            Cần chốt điểm hoặc xử lý phúc khảo?
          </p>
          <p className="mt-0.5 text-xs leading-5 text-blue-700">
            Trang này chỉ hiển thị kết quả tổng quan. Để chốt điểm, điều chỉnh
            điểm và xử lý phúc khảo, vào trang quản lý của lớp học phần.
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:items-end">
        {/* Nếu ca có nhiều lớp, cho chọn lớp trước khi navigate */}
        {validOptions.length > 1 && (
          <div className="relative">
            <select
              value={activeCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="appearance-none rounded-lg border border-blue-200 bg-white py-2 pl-3 pr-8 text-xs font-semibold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-300"
            >
              {validOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-blue-500"
            />
          </div>
        )}

        {gradingUrl ? (
          <button
            type="button"
            onClick={() => navigate(gradingUrl)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
          >
            <ExternalLink size={15} />
            Vào trang chấm điểm lớp
          </button>
        ) : (
          <span className="rounded-xl border border-blue-200 bg-white px-4 py-2.5 text-xs font-medium text-blue-500">
            Không xác định được lớp học phần
          </span>
        )}
      </div>
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

interface ExamSubmissionsReadOnlyTabProps {
  submissions: ExamSubmission[]
  sessions: ExamSchedule[]
  selectedSessionId: string
  selectedSession?: ExamSchedule | null
  onSessionChange: (sessionId: string) => void
  onViewSubmission: (submission: ExamSubmission) => void
  onViewViolations: (submission: ExamSubmission) => void
  loading: boolean
  pagination: {
    page: number
    pageSize: number
    totalItems: number
    totalPages: number
  }
  onPageChange: (page: number) => void
  canReview: boolean
  showSessionSelector?: boolean
  unavailableTitle?: string
  unavailableDescription?: string
  examId: string
}

export function ExamSubmissionsReadOnlyTab({
  submissions,
  sessions,
  selectedSessionId,
  selectedSession,
  onSessionChange,
  onViewSubmission,
  onViewViolations,
  loading,
  pagination,
  onPageChange,
  canReview,
  showSessionSelector = true,
  unavailableTitle = 'Ca thi chưa kết thúc',
  unavailableDescription = 'Bài nộp và kết quả chỉ được mở sau khi ca thi kết thúc.',
  examId,
}: ExamSubmissionsReadOnlyTabProps) {
  const columns: ColumnDef<ExamSubmission>[] = [
    {
      header: 'MSSV',
      width: '120px',
      render: (s) => (
        <span className="text-sm font-semibold text-blue-600">{s.studentCode}</span>
      ),
    },
    {
      header: 'Sinh viên',
      width: '210px',
      render: (s) => (
        <span className="text-sm font-bold text-gray-900">{s.studentName}</span>
      ),
    },
    {
      header: 'Nộp lúc',
      width: '150px',
      render: (s) =>
        s.hasSubmitted ? (
          <span className="text-sm font-medium text-gray-600">{s.submittedAt}</span>
        ) : (
          <span className="inline-flex rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-500">
            Không tham gia
          </span>
        ),
    },
    {
      header: 'Điểm hệ thống',
      width: '130px',
      align: 'center',
      render: (s) => <ScoreBadge score={s.autoScore} />,
    },
    {
      header: 'Điểm chính thức',
      width: '140px',
      align: 'center',
      render: (s) => <ScoreBadge score={s.finalScore} />,
    },
    {
      header: 'Vi phạm',
      width: '120px',
      align: 'center',
      render: (s) => {
        if (s.violationCount === 0) {
          return (
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-400">
              Không có
            </span>
          )
        }
        return (
          <button
            type="button"
            onClick={() => onViewViolations(s)}
            className={`relative inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              s.violationsViewed
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            <ShieldAlert size={14} />
            {s.violationCount}
            {!s.violationsViewed && (
              <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-600" />
            )}
          </button>
        )
      },
    },
    {
      header: 'Trạng thái',
      width: '120px',
      align: 'center',
      render: (s) =>
        s.status === 'PUBLISHED' ? (
          <AppBadge tone="emerald">Đã chốt</AppBadge>
        ) : (
          <AppBadge tone="amber">Chưa chốt</AppBadge>
        ),
    },
    {
      header: 'Phúc khảo',
      width: '130px',
      align: 'center',
      render: (s) => {
        if (!s.regradeRequest) return <span className="text-sm text-gray-400">—</span>
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
          <AppBadge tone={tones[s.regradeRequest.status]}>
            {labels[s.regradeRequest.status]}
          </AppBadge>
        )
      },
    },
    {
      header: 'Thao tác',
      width: '80px',
      align: 'right',
      render: (s) => (
        <button
          type="button"
          onClick={() => {
            if (s.hasSubmitted) onViewSubmission(s)
          }}
          disabled={!s.hasSubmitted}
          title={s.hasSubmitted ? 'Xem bài làm' : 'Sinh viên không nộp bài'}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
        >
          <Eye size={17} />
        </button>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      {/* Session selector */}
      {showSessionSelector && (
        <div className="flex flex-col justify-between gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:flex-row sm:items-center">
          <div>
            <p className="text-base font-semibold text-gray-900">Ca thi đang xem</p>
            <p className="mt-0.5 text-sm text-gray-500">
              Chọn ca thi để xem kết quả bài nộp.
            </p>
          </div>
          <AppSelect
            value={selectedSessionId}
            onChange={onSessionChange}
            className="w-full sm:w-96"
            buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm"
            options={sessions.map((session) => ({
              value: session.id,
              label: `${session.courseCode} - ${formatSessionRange(session.startTime, session.endTime)}`,
            }))}
          />
        </div>
      )}

      {/* Ca thi chưa kết thúc */}
      {!canReview && (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-12 text-center">
          <p className="text-base font-semibold text-gray-900">{unavailableTitle}</p>
          <p className="mt-1 text-sm text-gray-500">{unavailableDescription}</p>
        </div>
      )}

      {canReview && (
        <>
          {/* Banner dẫn sang trang chốt điểm */}
          <GradingBanner session={selectedSession} examId={examId} />

          {/* Bảng bài nộp — chỉ đọc */}
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

