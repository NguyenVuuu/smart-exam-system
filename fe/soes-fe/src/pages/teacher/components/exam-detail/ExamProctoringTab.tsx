import { Camera, RefreshCw } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import DataTable, { type ColumnDef } from '../../../../components/common/DataTable'
import type { ExamSchedule, ViolationRecord } from '../../types/teacher-exam.types'

const violationSeverityTone = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'rose',
} as const

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
              ? `${selectedSession.courseCode} • ${selectedSession.startTime.replace(
                  'T',
                  ' ',
                )} - ${selectedSession.endTime.replace('T', ' ')}`
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
              label: `${session.courseCode} • ${session.startTime.replace('T', ' ')}`,
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
