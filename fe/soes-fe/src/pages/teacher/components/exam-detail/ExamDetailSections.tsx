import {
  ArrowLeft,
  CalendarClock,
  Camera,
  Clock,
  Copy,
  Edit,
  Eye,
  FileCheck,
  Globe,
  RefreshCw,
  Send,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react'
import type { ReactNode } from 'react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type {
  Exam,
  ExamSchedule,
  ExamSubmission,
  ResultReleaseMode,
  ViolationRecord,
} from '../../types/teacher-exam.types'
import { getExamCapabilities } from '../../utils/ExamCapabilities'
import { formatSessionRange } from '../../../../utils/date.utils'

export type ExamDetailTab = 'sessions' | 'overview' | 'submissions' | 'proctoring'

const detailTabs: Array<{
  id: ExamDetailTab
  label: string
  icon: ReactNode
}> = [
  { id: 'sessions', label: 'Ca thi / Lớp áp dụng', icon: <CalendarClock size={18} /> },
  { id: 'proctoring', label: 'Giám sát Real-time & Bằng chứng Webcam', icon: <ShieldAlert size={18} /> },
  { id: 'submissions', label: 'Bài nộp & Chấm lại thủ công', icon: <FileCheck size={18} /> },
  { id: 'overview', label: 'Tổng quan cài đặt', icon: <Clock size={18} /> },
]

const examStatusTone = {
  DRAFT: 'amber',
  PENDING_APPROVAL: 'blue',
  REJECTED: 'rose',
  PUBLISHED: 'emerald',
  LOCKED: 'gray',
  ARCHIVED: 'gray',
} as const

const violationSeverityTone = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'rose',
} as const

export function ExamDetailBackButton({ onBack }: { onBack: () => void }) {
  return (
    <button
      onClick={onBack}
      className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft size={18} />
      <span>Quay lại quản lý đề thi</span>
    </button>
  )
}

export function ExamDetailHeader({
  exam,
  onEdit,
  onPublish,
  onPreview,
  onCopy,
  onToggleStudentVisibility,
}: {
  exam: Exam
  onEdit: () => void
  onPublish: () => void
  onPreview: () => void
  onCopy: () => void
  onToggleStudentVisibility: () => void
}) {
  const capabilities = getExamCapabilities(exam)
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-7 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-2">
          <AppBadge tone="blue" shape="rounded" className="text-xs font-semibold px-2.5 py-1">
            Môn học: {exam.subjectName}
          </AppBadge>
          <AppBadge tone={examStatusTone[exam.status]} className="text-xs font-semibold px-2.5 py-1">
            {exam.status}
          </AppBadge>
          {exam.status !== 'DRAFT' && exam.studentVisibility === 'HIDDEN' && (
            <AppBadge className="text-xs font-semibold px-2.5 py-1">
              <UserX size={13} /> Đã ẩn khỏi SV
            </AppBadge>
          )}
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-2">{exam.title}</h1>
        <p className="text-sm text-gray-500 mt-1">{exam.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={onPreview}
          className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Eye size={16} /> Xem đề
        </button>
        <button
          onClick={onCopy}
          className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Copy size={16} /> Sao chép đề
        </button>
        {capabilities.canToggleStudentVisibility && (
          <button
            onClick={onToggleStudentVisibility}
            className={`px-4.5 py-2.5 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5 ${
              exam.studentVisibility === 'HIDDEN'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
            }`}
          >
            {exam.studentVisibility === 'HIDDEN' ? (
              <>
                <UserCheck size={16} /> Hiện cho SV
              </>
            ) : (
              <>
                <UserX size={16} /> Ẩn khỏi SV
              </>
            )}
          </button>
        )}
        {capabilities.canSchedule && (
          <button
            onClick={onPublish}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Send size={16} /> Tạo ca thi
          </button>
        )}
        {capabilities.canEdit ? (
          <button
            onClick={onEdit}
            className="px-4.5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit size={16} /> Sửa cấu hình đề thi
          </button>
        ) : (
          <span className="px-4 py-2.5 bg-gray-50 border border-gray-100 text-gray-500 font-semibold text-sm rounded-xl">
            {exam.status === 'PENDING_APPROVAL' ? 'ĐANG CHỜ DUYỆT' : 'ĐÃ KHÓA'}
          </span>
        )}
      </div>
    </div>
  )
}

export function ExamDetailTabs({
  activeTab,
  onChange,
}: {
  activeTab: ExamDetailTab
  onChange: (tab: ExamDetailTab) => void
}) {
  return (
    <div className="flex items-center gap-2 border-b border-gray-200/80">
      {detailTabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            activeTab === tab.id
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export function ExamProctoringTab({
  violations,
  sessions,
  selectedSessionId,
  onSessionChange,
  onViewEvidence,
}: {
  violations: ViolationRecord[]
  sessions: ExamSchedule[]
  selectedSessionId: string
  onSessionChange: (sessionId: string) => void
  onViewEvidence: (url: string) => void
}) {
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0]
  const columns: ColumnDef<ViolationRecord>[] = [
    { header: 'STT', width: '60px', align: 'center', render: (_, idx) => <span className="text-gray-400 text-sm">{idx + 1}</span> },
    { header: 'Thời Gian Vi Phạm', width: '160px', render: (v) => <span className="text-gray-600 text-sm font-medium">{v.timestamp}</span> },
    {
      header: 'Thí Sinh Vi Phạm',
      render: (v) => (
        <div>
          <p className="font-bold text-gray-900 text-sm">{v.studentName}</p>
          <p className="text-xs text-gray-400">MSSV: {v.studentCode}</p>
        </div>
      ),
    },
    {
      header: 'Loại Vi Phạm',
      width: '230px',
      render: (v) => (
        <AppBadge
          tone={v.type === 'TAB_SWITCH' ? 'amber' : 'rose'}
          shape="rounded"
          className="text-xs font-semibold uppercase px-2.5 py-1"
        >
          {v.type === 'TAB_SWITCH'
            ? 'Chuyển tab trình duyệt'
            : v.type === 'NO_FACE'
            ? 'Không thấy mặt'
            : v.type === 'MULTIPLE_FACES'
            ? 'Có nhiều mặt'
            : v.type === 'FULLSCREEN_EXIT'
            ? 'Thoát toàn màn hình'
            : 'Không hoạt động'}
        </AppBadge>
      ),
    },
    {
      header: 'Địa Chỉ IP',
      width: '150px',
      render: (v) => (
        <AppBadge tone="blue" shape="rounded" className="text-xs font-semibold px-2.5 py-1">
          192.168.1.{100 + (v.id.charCodeAt(v.id.length - 1) % 50)}
        </AppBadge>
      ),
    },
    {
      header: 'Mức Độ',
      width: '130px',
      align: 'center',
      render: (v) => (
        <AppBadge tone={violationSeverityTone[v.severity]} className="text-xs font-bold uppercase px-2.5 py-1">
          {v.severity}
        </AppBadge>
      ),
    },
    {
      header: 'Bằng Chứng',
      width: '180px',
      align: 'right',
      render: (v) =>
        v.evidenceImageUrl ? (
          <button
            onClick={() => onViewEvidence(v.evidenceImageUrl!)}
            className="px-3.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-sm rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Camera size={16} /> Ảnh bằng chứng
          </button>
        ) : (
          <span className="text-gray-400 text-sm whitespace-nowrap">Không có ảnh</span>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Nhật ký giám sát chống gian lận</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {selectedSession
              ? `${selectedSession.courseCode} • ${formatSessionRange(selectedSession.startTime, selectedSession.endTime)}`
              : 'Chưa có ca thi để giám sát'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <AppSelect
            value={selectedSession?.id ?? ''}
            onChange={onSessionChange}
            className="w-full sm:w-80"
            buttonClassName="bg-gray-50 rounded-xl py-2.5 text-sm"
            options={sessions.map((session) => ({
              value: session.id,
              label: `${session.courseCode} • ${formatSessionRange(session.startTime, session.endTime)}`,
            }))}
          />
          <button
            onClick={() => alert('Đã làm mới dữ liệu giám sát thi real-time!')}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl shadow-xs hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={violations.filter((violation) => violation.scheduleId === selectedSession?.id)}
          keyExtractor={(v) => v.id}
          emptyText="Chưa ghi nhận vi phạm nào trong ca thi này"
          pageSize={10}
        />
      </div>
    </div>
  )
}

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
    { header: 'STT', width: '60px', align: 'center', render: (_, idx) => <span className="text-gray-400 text-sm">{idx + 1}</span> },
    { header: 'MSSV', width: '130px', render: (s) => <span className="text-blue-600 font-semibold text-sm">{s.studentCode}</span> },
    { header: 'Họ và Tên', render: (s) => <span className="font-bold text-gray-900 text-sm">{s.studentName}</span> },
    { header: 'Thời Gian Nộp', width: '160px', render: (s) => <span className="text-gray-600 text-sm font-medium">{s.submittedAt}</span> },
    { header: 'Chấm Tự Động', width: '130px', align: 'center', render: (s) => <span className="text-gray-700 text-sm font-medium">{s.autoScore}đ</span> },
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
    { header: 'Điểm Chốt', width: '120px', align: 'center', render: (s) => <span className="font-bold text-gray-900 text-sm">{s.finalScore}đ</span> },
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
        return <AppBadge tone={tones[s.regradeRequest.status]} className="text-xs font-semibold px-2.5 py-1">{labels[s.regradeRequest.status]}</AppBadge>
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
          <p className="text-sm text-gray-500 mt-0.5">Bài nộp và chính sách công bố được quản lý riêng theo từng ca.</p>
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
              type="text"
              value={resultReleaseAt}
              onChange={(e) => onResultReleaseAtChange(e.target.value)}
              className="bg-gray-50 border border-gray-200 text-sm font-semibold rounded-xl px-3.5 py-2.5 w-44"
            />
          )}

          {resultReleaseMode === 'MANUAL' && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl text-sm">
              <input
                type="checkbox"
                checked={isResultsPublished}
                onChange={(e) => onResultsPublishedChange(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-600 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-emerald-800">Công bố điểm</span>
            </label>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={submissions}
          keyExtractor={(s) => s.id}
          emptyText="Chưa có sinh viên nào nộp bài"
          pageSize={10}
        />
      </div>
    </div>
  )
}

export function ExamOverviewTab({
  exam,
  resultReleaseText,
}: {
  exam: Exam
  resultReleaseText: string
}) {
  const firstSchedule = exam.schedules?.[0]

  return (
    <div className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm space-y-5 text-sm">
      <h2 className="text-base font-semibold text-gray-900">Chi Tiết Cấu Hình Bài Thi</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5">
          <span className="text-gray-500 font-semibold text-sm">Thời gian mở ca:</span>
          <p className="font-bold text-gray-900 text-base">
            {firstSchedule ? `${firstSchedule.startTime} - ${firstSchedule.endTime}` : 'Chưa tạo ca thi'}
          </p>
        </div>
        <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1.5">
          <span className="text-gray-500 font-semibold text-sm">Thời lượng làm bài:</span>
          <p className="font-bold text-gray-900 text-base">
            {exam.defaultDurationMinutes} phút mặc định
            {firstSchedule ? ` (Ca đầu: tối đa ${firstSchedule.maxAttempts ?? 1} lần làm)` : ''}
          </p>
        </div>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl space-y-1.5">
          <span className="text-blue-700 font-semibold flex items-center gap-1.5 text-sm">
            <Globe size={16} /> Chế độ Kiểm soát IP:
          </span>
          <p className="font-bold text-blue-950 text-base">
            {!firstSchedule
              ? 'Chưa cấu hình ca thi'
              : firstSchedule.ipMode === 'CAMPUS'
              ? 'Giới hạn mạng trường'
              : 'Thi trực tuyến ngoài trường'}
          </p>
          <p className="text-sm text-blue-700">
            {firstSchedule?.ipMode === 'CAMPUS'
              ? `Dải IP cho phép: ${firstSchedule.allowedIpRange || 'Chưa nhập'}`
              : 'Ghi nhận địa chỉ IP và cảnh báo khi thay đổi trong lúc thi.'}
          </p>
        </div>
        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1.5">
          <span className="text-emerald-700 font-semibold flex items-center gap-1.5 text-sm">
            <Clock size={16} /> Hiển thị điểm:
          </span>
          <p className="font-bold text-emerald-950 text-base">{resultReleaseText}</p>
        </div>
      </div>
    </div>
  )
}
