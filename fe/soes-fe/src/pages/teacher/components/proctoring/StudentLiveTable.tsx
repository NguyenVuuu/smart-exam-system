import { ClockPlus, MonitorUp, ShieldX, Square, Upload, Video } from 'lucide-react'
import AppBadge from '../../../../components/common/AppBadge'
import AppSelect from '../../../../components/common/AppSelect'
import type { ProctoringSessionRecord } from '../../types/teacher-exam.types'

export type LiveStreamType = 'WEBCAM' | 'SCREEN'

const webcamTone = {
  NOT_REQUIRED: 'gray',
  PENDING_PERMISSION: 'amber',
  ACTIVE: 'emerald',
  DISCONNECTED: 'rose',
  PERMISSION_DENIED: 'rose',
  BLOCKED: 'rose',
} as const

const webcamLabel = {
  NOT_REQUIRED: 'Không yêu cầu',
  PENDING_PERMISSION: 'Chờ quyền',
  ACTIVE: 'Đang bật',
  DISCONNECTED: 'Mất kết nối',
  PERMISSION_DENIED: 'Mất quyền',
  BLOCKED: 'Bị chặn',
} as const

const screenTone = {
  NOT_REQUIRED: 'gray',
  PENDING_PERMISSION: 'amber',
  ACTIVE: 'emerald',
  STOPPED: 'rose',
  PERMISSION_DENIED: 'rose',
} as const

const screenLabel = {
  NOT_REQUIRED: 'Không yêu cầu',
  PENDING_PERMISSION: 'Chờ quyền',
  ACTIVE: 'Đang chia sẻ',
  STOPPED: 'Đã dừng',
  PERMISSION_DENIED: 'Mất quyền',
} as const

export interface StudentLiveTableProps {
  sessions: ProctoringSessionRecord[]
  liveAttemptId: string | null
  liveStreamType: LiveStreamType
  onStartLive: (session: ProctoringSessionRecord, streamType: LiveStreamType) => void
  onStopLive: () => void
  onExtendTime: (session: ProctoringSessionRecord) => void
  onForceSubmit: (session: ProctoringSessionRecord) => void
  onInvalidate: (session: ProctoringSessionRecord) => void
}

export default function StudentLiveTable({
  sessions,
  liveAttemptId,
  liveStreamType,
  onStartLive,
  onStopLive,
  onExtendTime,
  onForceSubmit,
  onInvalidate,
}: StudentLiveTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-5 py-3">Sinh viên</th>
            <th className="whitespace-nowrap px-5 py-3">Online</th>
            <th className="whitespace-nowrap px-5 py-3" title="Trạng thái do thiết bị sinh viên báo; xem luồng trực tiếp để xác nhận">Camera</th>
            <th className="whitespace-nowrap px-5 py-3" title="Trạng thái do thiết bị sinh viên báo; xem luồng trực tiếp để xác nhận">Màn hình</th>
            <th className="whitespace-nowrap px-5 py-3">Tiến độ</th>
            <th className="whitespace-nowrap px-5 py-3">Tín hiệu</th>
            <th className="whitespace-nowrap px-5 py-3 text-right">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <tr
              key={session.attemptId}
              className={liveAttemptId === session.attemptId ? 'bg-blue-50/60' : 'hover:bg-gray-50/70 transition-colors'}
            >
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">{session.studentName}</p>
                <p className="text-xs text-blue-600 font-medium">MSSV: {session.studentCode}</p>
                {session.attemptStatus === 'INVALIDATED' && <p className="mt-1 text-xs font-semibold text-rose-700">Bài thi đã hủy</p>}
                {session.endedBy === 'PROCTOR' && session.attemptStatus !== 'INVALIDATED' && <p className="mt-1 text-xs font-semibold text-amber-700">Đã buộc nộp</p>}
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={session.isOnline ? 'blue' : 'gray'}>
                  {session.isOnline ? 'Online' : 'Offline'}
                </AppBadge>
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={webcamTone[session.webcamStatus]}>
                  {webcamLabel[session.webcamStatus]}
                </AppBadge>
                {session.visionStatus === 'UNAVAILABLE' && <p className="mt-1 text-xs font-medium text-amber-700">Nhận diện tạm ngừng</p>}
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={screenTone[session.screenShareStatus]}>
                  {screenLabel[session.screenShareStatus]}
                </AppBadge>
              </td>
              <td className="px-5 py-4 text-slate-600 font-medium">
                {session.answeredCount}/{session.totalQuestionCount}
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={session.violationCount >= 3 ? 'rose' : session.violationCount > 0 ? 'amber' : 'gray'}>
                  {session.violationCount} tín hiệu
                </AppBadge>
              </td>
              <td className="whitespace-nowrap px-3 py-4 text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {liveAttemptId === session.attemptId ? (
                    <button
                      type="button"
                      onClick={onStopLive}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
                    >
                      <Square size={14} /> {liveStreamType === 'SCREEN' ? 'Ngắt màn hình' : 'Ngắt camera'}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => onStartLive(session, 'WEBCAM')}
                        disabled={!session.isOnline || session.webcamStatus !== 'ACTIVE'}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        <Video size={14} /> Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => onStartLive(session, 'SCREEN')}
                        disabled={!session.isOnline || session.screenShareStatus !== 'ACTIVE'}
                        className="inline-flex items-center gap-1 rounded-lg bg-cyan-600 px-2 py-2 text-xs font-semibold text-white hover:bg-cyan-700 transition-colors disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                      >
                        <MonitorUp size={14} /> Màn hình
                      </button>
                    </>
                  )}
                  <AppSelect
                    value=""
                    ariaLabel={`Xử lý bài thi của ${session.studentName}`}
                    placeholder="Xử lý"
                    disabled={session.attemptStatus !== 'IN_PROGRESS'}
                    className="w-26 shrink-0"
                    buttonClassName="h-8 rounded-lg px-2 text-xs font-semibold"
                    options={[
                      { value: 'extend', label: <span className="inline-flex items-center gap-2"><ClockPlus size={14} /> Gia hạn</span> },
                      { value: 'submit', label: <span className="inline-flex items-center gap-2"><Upload size={14} /> Buộc nộp</span> },
                      { value: 'invalidate', label: <span className="inline-flex items-center gap-2 text-rose-700"><ShieldX size={14} /> Hủy bài</span> },
                    ]}
                    onChange={(action) => {
                      if (action === 'extend') onExtendTime(session)
                      if (action === 'submit') onForceSubmit(session)
                      if (action === 'invalidate') onInvalidate(session)
                    }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sessions.length === 0 && (
        <div className="px-6 py-12 text-center text-sm text-slate-400">
          Chưa có sinh viên phù hợp.
        </div>
      )}
    </div>
  )
}
