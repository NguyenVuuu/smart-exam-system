import { Camera, RefreshCw } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { ExamSchedule, ProctoringSessionRecord, ViolationRecord } from '../../types/teacher-exam.types'
import { formatSessionRange } from '../../../../utils/date.utils'

const violationSeverityTone = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'rose',
} as const

const webcamStatusTone = {
  NOT_REQUIRED: 'gray',
  PENDING_PERMISSION: 'amber',
  ACTIVE: 'emerald',
  DISCONNECTED: 'rose',
  PERMISSION_DENIED: 'rose',
  BLOCKED: 'rose',
} as const

const webcamStatusLabel = {
  NOT_REQUIRED: 'Không yêu cầu',
  PENDING_PERMISSION: 'Chờ cấp quyền',
  ACTIVE: 'Đang bật',
  DISCONNECTED: 'Mất kết nối',
  PERMISSION_DENIED: 'Mất quyền',
  BLOCKED: 'Bị chặn',
} as const

export function ExamProctoringTab({
  violations,
  proctoringSessions,
  isLoadingProctoringSessions,
  sessions,
  selectedSessionId,
  onSessionChange,
  onViewEvidence,
}: {
  violations: ViolationRecord[]
  proctoringSessions: ProctoringSessionRecord[]
  isLoadingProctoringSessions: boolean
  sessions: ExamSchedule[]
  selectedSessionId: string
  onSessionChange: (sessionId: string) => void
  onViewEvidence: (url: string) => void
}) {
  const selectedSession = sessions.find((session) => session.id === selectedSessionId) ?? sessions[0]
  const activeWebcamCount = proctoringSessions.filter((session) => session.webcamStatus === 'ACTIVE').length
  const warningWebcamCount = proctoringSessions.filter((session) =>
    ['DISCONNECTED', 'PERMISSION_DENIED', 'BLOCKED'].includes(session.webcamStatus),
  ).length
  const columns: ColumnDef<ViolationRecord>[] = [
    {
      header: 'STT',
      width: '60px',
      align: 'center',
      render: (_, idx) => <span className="text-gray-400 text-sm">{idx + 1}</span>,
    },
    {
      header: 'Thời Gian Vi Phạm',
      width: '160px',
      render: (v) => <span className="text-gray-600 text-sm font-medium">{v.timestamp}</span>,
    },
    {
      header: 'Thời Lượng',
      width: '120px',
      render: (v) => <span className="text-gray-500 text-sm">{formatViolationDuration(v)}</span>,
    },
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
            : v.type === 'CAMERA_DISCONNECTED'
            ? 'Camera mất kết nối'
            : v.type === 'CAMERA_PERMISSION_DENIED'
            ? 'Quyền camera bị từ chối'
            : v.type === 'CAMERA_BLOCKED'
            ? 'Camera bị chặn'
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
            onClick={() => onSessionChange(selectedSession?.id ?? '')}
            className="px-4 py-2.5 bg-white border border-gray-200 text-gray-700 font-semibold text-sm rounded-xl shadow-xs hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={15} /> Làm mới
          </button>
        </div>
      </div>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-gray-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Trạng thái camera hiện tại</h3>
            <p className="mt-0.5 text-sm text-gray-500">
              {activeWebcamCount} đang bật, {warningWebcamCount} cần chú ý
            </p>
          </div>
          {isLoadingProctoringSessions && <span className="text-xs font-semibold text-gray-400">Đang cập nhật...</span>}
        </div>

        {proctoringSessions.length === 0 ? (
          <div className="px-6 py-8 text-center text-sm text-gray-500">
            Chưa có sinh viên bắt đầu làm bài trong ca thi này.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {proctoringSessions.map((session) => (
              <div key={session.attemptId} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(180px,1fr)_140px_150px_150px_minmax(180px,1fr)] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-gray-900">{session.studentName}</p>
                  <p className="text-xs text-gray-500">{session.studentCode}</p>
                </div>
                <AppBadge tone={session.isOnline ? 'blue' : 'gray'} shape="rounded" className="w-fit px-2.5 py-1 text-xs font-semibold">
                  {session.isOnline ? 'Online' : 'Offline'}
                </AppBadge>
                <AppBadge tone={webcamStatusTone[session.webcamStatus]} shape="rounded" className="w-fit px-2.5 py-1 text-xs font-semibold">
                  {webcamStatusLabel[session.webcamStatus]}
                </AppBadge>
                <span className="text-sm text-gray-500">
                  {session.lastWebcamHeartbeatAt ? formatCompactTime(session.lastWebcamHeartbeatAt) : '-'}
                </span>
                <span className="text-sm text-gray-500">
                  {session.lastViolation ? formatProctoringLastViolation(session.lastViolation) : 'Chưa có vi phạm'}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

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

function formatViolationDuration(violation: ViolationRecord) {
  if (violation.durationSeconds === null && violation.endedAt === null) return 'Đang diễn ra'
  return formatDurationSeconds(violation.durationSeconds)
}

function formatCompactTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(new Date(value))
}

function formatProctoringLastViolation(violation: NonNullable<ProctoringSessionRecord['lastViolation']>) {
  const duration = violation.durationSeconds === null && violation.endedAt === null
    ? 'Đang diễn ra'
    : formatDurationSeconds(violation.durationSeconds)

  return `${violation.type}${duration === '-' ? '' : ` (${duration})`}`
}

function formatDurationSeconds(durationSeconds?: number | null) {
  if (durationSeconds === undefined || durationSeconds === null) return '-'
  if (durationSeconds < 60) return `${durationSeconds}s`

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60
  return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`
}
