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
      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
    >
      <ArrowLeft size={16} />
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
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <div className="flex items-center gap-2">
          <AppBadge tone="blue" shape="rounded" className="text-xs">
            Môn học: {exam.subjectName}
          </AppBadge>
          <AppBadge tone={examStatusTone[exam.status]} className="text-xs">{exam.status}</AppBadge>
          {exam.status !== 'DRAFT' && exam.studentVisibility === 'HIDDEN' && (
            <AppBadge className="text-xs font-medium">
              <UserX size={12} /> Đã ẩn khỏi SV
            </AppBadge>
          )}
        </div>
        <h1 className="text-xl font-bold text-gray-900 tracking-tight mt-1">{exam.title}</h1>
        <p className="text-xs text-gray-500 mt-0.5">{exam.description}</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onPreview}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Eye size={15} /> Xem đề
        </button>
        <button
          onClick={onCopy}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
        >
          <Copy size={15} /> Sao chép đề
        </button>
        {capabilities.canToggleStudentVisibility && (
          <button
            onClick={onToggleStudentVisibility}
            className={`px-4 py-2 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5 ${
              exam.studentVisibility === 'HIDDEN'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700'
            }`}
          >
            {exam.studentVisibility === 'HIDDEN' ? (
              <>
                <UserCheck size={15} /> Hiện cho SV
              </>
            ) : (
              <>
                <UserX size={15} /> Ẩn khỏi SV
              </>
            )}
          </button>
        )}
        {capabilities.canSchedule && (
          <button
            onClick={onPublish}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Send size={15} /> Tạo ca thi
          </button>
        )}
        {capabilities.canEdit ? (
          <button
            onClick={onEdit}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
          >
            <Edit size={15} /> Sửa cấu hình đề thi
          </button>
        ) : (
          <span className="px-3 py-2 bg-gray-50 border border-gray-100 text-gray-500 font-semibold text-xs rounded-xl">
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
    { header: 'STT', width: '50px', align: 'center', render: (_, idx) => <span className="text-gray-400">{idx + 1}</span> },
    { header: 'Thời Gian Vi Phạm', width: '140px', render: (v) => <span className="text-gray-600 text-xs">{v.timestamp}</span> },
    {
      header: 'Thí Sinh Vi Phạm',
      render: (v) => (
        <div>
          <p className="font-semibold text-gray-900 text-xs">{v.studentName}</p>
          <p className="text-xs text-gray-400">MSSV: {v.studentCode}</p>
        </div>
      ),
    },
    {
      header: 'Loại Vi Phạm',
      width: '210px',
      render: (v) => (
        <AppBadge
          tone={v.type === 'TAB_SWITCH' ? 'amber' : 'rose'}
          shape="rounded"
          className="text-xs font-medium uppercase"
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
      width: '130px',
      render: (v) => (
        <AppBadge tone="blue" shape="rounded" className="text-xs font-medium">
          192.168.1.{100 + (v.id.charCodeAt(v.id.length - 1) % 50)}
        </AppBadge>
      ),
    },
    {
      header: 'Mức Độ',
      width: '120px',
      align: 'center',
      render: (v) => (
        <AppBadge tone={violationSeverityTone[v.severity]} className="text-xs font-medium uppercase">
          {v.severity}
        </AppBadge>
      ),
    },
    {
      header: 'Bằng Chứng',
      width: '160px',
      align: 'right',
      render: (v) =>
        v.evidenceImageUrl ? (
          <button
            onClick={() => onViewEvidence(v.evidenceImageUrl!)}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs rounded-xl transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Camera size={14} /> Ảnh bằng chứng
          </button>
        ) : (
          <span className="text-gray-400 text-xs whitespace-nowrap">Không có ảnh</span>
        ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="text-xs font-semibold text-gray-900">Nhật ký giám sát chống gian lận</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {selectedSession
              ? `${selectedSession.courseCode} • ${selectedSession.startTime.replace('T', ' ')} - ${selectedSession.endTime.replace('T', ' ')}`
              : 'Chưa có ca thi để giám sát'}
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <AppSelect
            value={selectedSession?.id ?? ''}
            onChange={onSessionChange}
            className="w-full sm:w-72"
            buttonClassName="bg-gray-50 rounded-lg py-2"
            options={sessions.map((session) => ({
              value: session.id,
              label: `${session.courseCode} • ${session.startTime.replace('T', ' ')}`,
            }))}
          />
        <button
          onClick={() => alert('Đã làm mới dữ liệu giám sát thi real-time!')}
          className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 font-medium text-xs rounded-lg shadow-2xs hover:bg-gray-50 flex items-center gap-1"
        >
          <RefreshCw size={13} /> Refresh
        </button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={violations.filter((violation) => violation.scheduleId === selectedSession?.id)}
        keyExtractor={(v) => v.id}
        emptyText="Chưa ghi nhận vi phạm nào trong ca thi này"
        pageSize={10}
      />
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
    { header: 'STT', width: '50px', align: 'center', render: (_, idx) => <span className="text-gray-400">{idx + 1}</span> },
    { header: 'MSSV', width: '110px', render: (s) => <span className="text-blue-600">{s.studentCode}</span> },
    { header: 'Họ và Tên', render: (s) => <span className="font-semibold text-gray-900">{s.studentName}</span> },
    { header: 'Thời Gian Nộp', width: '140px', render: (s) => <span className="text-gray-600 text-xs">{s.submittedAt}</span> },
    { header: 'Chấm Tự Động', width: '120px', align: 'center', render: (s) => <span className="text-gray-600 text-xs">{s.autoScore}đ</span> },
    {
      header: 'Ghi Đè Thủ Công',
      width: '130px',
      align: 'center',
      render: (s) =>
        s.manualScoreOverride !== undefined ? (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md">
            {s.manualScoreOverride}đ
          </span>
        ) : (
          <span className="text-gray-400">-</span>
        ),
    },
    { header: 'Điểm Chốt', width: '100px', align: 'center', render: (s) => <span className="font-semibold text-gray-900">{s.finalScore}đ</span> },
    {
      header: 'Phúc Khảo',
      width: '120px',
      align: 'center',
      render: (s) => {
        if (!s.regradeRequest) return <span className="text-gray-400">-</span>
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
        return <AppBadge tone={tones[s.regradeRequest.status]}>{labels[s.regradeRequest.status]}</AppBadge>
      },
    },
    {
      header: 'Thao Tác',
      width: '210px',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => onViewSubmission(s)}
            title="Xem lại bài làm"
            className="w-8 h-8 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors inline-flex items-center justify-center"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => onEditSubmission(s)}
            title="Sửa điểm phúc khảo"
            className="w-8 h-8 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors inline-flex items-center justify-center"
          >
            <Edit size={15} />
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
        <div><p className="text-xs font-semibold text-gray-900">Ca thi đang xem</p><p className="text-xs text-gray-500">Bài nộp và chính sách công bố được quản lý riêng theo từng ca.</p></div>
        <AppSelect value={selectedSessionId} onChange={onSessionChange} className="w-80" options={sessions.map((session) => ({ value: session.id, label: `${session.courseCode} • ${session.startTime.replace('T', ' ')}` }))} />
      </div>
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-bold text-gray-900">Cấu hình hiển thị điểm</p>
          <p className="text-xs text-gray-500">{resultReleaseText}</p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <AppSelect
            value={resultReleaseMode}
            onChange={onResultReleaseModeChange}
            className="w-48"
            buttonClassName="bg-gray-50 rounded-lg py-2"
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
              className="bg-gray-50 border border-gray-200 text-xs font-semibold rounded-lg px-3 py-2 w-40"
            />
          )}

          {resultReleaseMode === 'MANUAL' && (
            <label className="flex items-center gap-2 cursor-pointer select-none bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg text-xs">
              <input
                type="checkbox"
                checked={isResultsPublished}
                onChange={(e) => onResultsPublishedChange(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-emerald-800">Công bố điểm</span>
            </label>
          )}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={submissions}
        keyExtractor={(s) => s.id}
        emptyText="Chưa có sinh viên nào nộp bài"
        pageSize={10}
      />
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
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4 text-xs">
      <h2 className="text-xs font-bold text-gray-900">Chi Tiết Cấu Hình Bài Thi</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
          <span className="text-gray-400 font-semibold">Thời gian mở ca:</span>
          <p className="font-bold text-gray-800">
            {firstSchedule ? `${firstSchedule.startTime} - ${firstSchedule.endTime}` : 'Chưa tạo ca thi'}
          </p>
        </div>
        <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
          <span className="text-gray-400 font-semibold">Thời lượng làm bài:</span>
          <p className="font-bold text-gray-800">
            {exam.defaultDurationMinutes} phút mặc định
            {firstSchedule ? ` (Ca đầu: tối đa ${firstSchedule.maxAttempts ?? 1} lần làm)` : ''}
          </p>
        </div>
        <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-1">
          <span className="text-blue-600 font-semibold flex items-center gap-1">
            <Globe size={14} /> Chế độ Kiểm soát IP:
          </span>
          <p className="font-semibold text-blue-900">
            {!firstSchedule
              ? 'Chưa cấu hình ca thi'
              : firstSchedule.ipMode === 'CAMPUS'
              ? 'Giới hạn mạng trường'
              : 'Thi trực tuyến ngoài trường'}
          </p>
          <p className="text-xs text-blue-700">
            {firstSchedule?.ipMode === 'CAMPUS'
              ? `Dải IP cho phép: ${firstSchedule.allowedIpRange || 'Chưa nhập'}`
              : 'Ghi nhận địa chỉ IP và cảnh báo khi thay đổi trong lúc thi.'}
          </p>
        </div>
        <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl space-y-1">
          <span className="text-emerald-700 font-semibold flex items-center gap-1">
            <Clock size={14} /> Hiển thị điểm:
          </span>
          <p className="font-bold text-emerald-950">{resultReleaseText}</p>
        </div>
      </div>
    </div>
  )
}
