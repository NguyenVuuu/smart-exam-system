import {
  AlertTriangle,
  Lock,
  MessageSquare,
  Plus,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import SendWarningModal from './components/exam-detail/SendWarningModal'

interface StudentSession {
  id: string
  scheduleId: string
  studentCode: string
  studentName: string
  status: 'ONLINE' | 'WARNING' | 'SUBMITTED' | 'OFFLINE'
  ipAddress: string
  progress: string
  violationsCount: number
  lastViolation?: string
  integrityScore: number
}

const MOCK_SESSIONS: StudentSession[] = [
  {
    id: 's-1',
    scheduleId: 'schedule-01',
    studentCode: 'SV2026001',
    studentName: 'Trần Minh Nam',
    status: 'WARNING',
    ipAddress: '192.168.1.102',
    progress: '18 / 30 câu (60%)',
    violationsCount: 2,
    lastViolation: 'Phát hiện chuyển tab (12 giây)',
    integrityScore: 70,
  },
  {
    id: 's-2',
    scheduleId: 'schedule-01',
    studentCode: 'SV2026003',
    studentName: 'Phạm Đức Anh',
    status: 'WARNING',
    ipAddress: '192.168.1.105',
    progress: '12 / 30 câu (40%)',
    violationsCount: 3,
    lastViolation: 'Webcam không phát hiện khuôn mặt',
    integrityScore: 55,
  },
  {
    id: 's-3',
    scheduleId: 'schedule-01',
    studentCode: 'SV2026002',
    studentName: 'Lê Thị Thu Thảo',
    status: 'SUBMITTED',
    ipAddress: '192.168.1.104',
    progress: '30 / 30 câu (100%)',
    violationsCount: 0,
    integrityScore: 100,
  },
  {
    id: 's-4',
    scheduleId: 'schedule-02',
    studentCode: 'SV2026004',
    studentName: 'Nguyễn Văn Hoàng',
    status: 'ONLINE',
    ipAddress: '192.168.1.110',
    progress: '22 / 30 câu (73%)',
    violationsCount: 0,
    integrityScore: 100,
  },
  {
    id: 's-5',
    scheduleId: 'schedule-02',
    studentCode: 'SV2026005',
    studentName: 'Đặng Mai Phương',
    status: 'ONLINE',
    ipAddress: '192.168.1.115',
    progress: '15 / 30 câu (50%)',
    violationsCount: 0,
    integrityScore: 100,
  },
]

const sessionStatusTone = {
  ONLINE: 'blue',
  WARNING: 'rose',
  SUBMITTED: 'emerald',
  OFFLINE: 'gray',
} as const

export default function TeacherLiveProctorPage() {
  const [sessions, setSessions] = useState<StudentSession[]>(MOCK_SESSIONS)
  const [selectedScheduleId, setSelectedScheduleId] = useState('schedule-01')
  const [searchQuery, setSearchQuery] = useState('')

  // State for Warning modal
  const [warningTarget, setWarningTarget] = useState<StudentSession | null>(null)
  const [actionTarget, setActionTarget] = useState<StudentSession | null>(null)
  const [actionType, setActionType] = useState<'ADD_TIME' | 'FORCE_SUBMIT'>('ADD_TIME')
  const [actionReason, setActionReason] = useState('')
  const [extraMinutes, setExtraMinutes] = useState(5)

  const sessionsInSchedule = sessions.filter((session) => session.scheduleId === selectedScheduleId)
  const totalOnline = sessionsInSchedule.filter((session) => session.status === 'ONLINE').length
  const totalWarning = sessionsInSchedule.filter((session) => session.status === 'WARNING').length
  const totalSubmitted = sessionsInSchedule.filter((session) => session.status === 'SUBMITTED').length

  const openAction = (session: StudentSession, type: 'ADD_TIME' | 'FORCE_SUBMIT') => {
    setActionTarget(session)
    setActionType(type)
    setActionReason('')
    setExtraMinutes(5)
  }

  const applyAction = () => {
    if (!actionTarget || actionReason.trim().length < 5) return
    if (actionType === 'FORCE_SUBMIT') {
      setSessions((prev) =>
        prev.map((session) => (session.id === actionTarget.id ? { ...session, status: 'SUBMITTED' } : session)),
      )
      toast.success(`Đã buộc nộp bài của ${actionTarget.studentName}.`)
    } else {
      toast.success(`Đã cộng ${extraMinutes} phút cho ${actionTarget.studentName}.`)
    }
    setActionTarget(null)
  }

  const handleSendWarning = (msg: string) => {
    if (!warningTarget) return
    setSessions((prev) =>
      prev.map((s) =>
        s.id === warningTarget.id
          ? {
              ...s,
              violationsCount: s.violationsCount + 1,
              status: 'WARNING',
              lastViolation: `Cảnh báo từ GV: ${msg.substring(0, 30)}...`,
              integrityScore: Math.max(0, s.integrityScore - 10),
            }
          : s,
      ),
    )
    toast.success(`Đã gửi cảnh báo tới ${warningTarget.studentName}.`)
    setWarningTarget(null)
  }

  const filteredSessions = sessionsInSchedule.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Giám Sát Ca Thi Trực Tuyến"
            description="Theo dõi phòng thi trực tiếp theo thời gian thực, nhận cảnh báo gian lận và can thiệp sự cố"
            icon={<ShieldAlert size={21} />}
            titleContent={
              <AppBadge tone="rose" className="text-xs font-bold uppercase animate-pulse">
                ● LIVE
              </AppBadge>
            }
            actions={
              <>
              <AppSelect
                value={selectedScheduleId}
                onChange={setSelectedScheduleId}
                className="w-72"
                buttonClassName="text-gray-900"
                options={[
                  { value: 'schedule-01', label: 'Giữa kỳ Java • JAVA_01 • 08:00' },
                  { value: 'schedule-02', label: 'Giữa kỳ Java • JAVA_02 • 13:00' },
                ]}
              />

              <button
                onClick={() => alert('Đã làm mới dữ liệu ca thi')}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <RefreshCw size={15} /> Làm Mới
              </button>
              </>
            }
          />

          {/* Stat Overview Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-500 block uppercase">Đang Làm Bài (Online)</span>
              <p className="text-2xl font-bold text-blue-600">{totalOnline}</p>
              <span className="text-xs text-gray-400">Kết nối ổn định</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-500 block uppercase">Cảnh Báo Vi Phạm</span>
              <p className="text-2xl font-bold text-rose-600">{totalWarning}</p>
              <span className="text-xs text-rose-600 font-medium">Chuyển tab / Mất webcam</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-500 block uppercase">Đã Nộp Bài</span>
              <p className="text-2xl font-bold text-emerald-600">{totalSubmitted}</p>
              <span className="text-xs text-gray-400">Hoàn thành bài thi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-gray-500 block uppercase">Tổng Thí Sinh Ca Thi</span>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              <span className="text-xs text-gray-400">Phòng thi trực tuyến</span>
            </div>
          </div>

          <TeacherTablePanel>
            <TeacherToolbar
              filters={<h3 className="text-sm font-semibold text-slate-950">Danh sách thí sinh trong phòng thi</h3>}
              searchValue={searchQuery}
              onSearchChange={setSearchQuery}
              searchPlaceholder="Tìm MSSV hoặc họ tên thí sinh..."
              onReset={() => setSearchQuery('')}
            />

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="select-none border-b border-gray-100 bg-gray-50/80 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                    <th className="px-6 py-4 whitespace-nowrap">Thí sinh</th>
                    <th className="px-6 py-4 whitespace-nowrap">Trạng thái</th>
                    <th className="px-6 py-4 whitespace-nowrap">Tiến độ</th>
                    <th className="px-6 py-4 whitespace-nowrap">Độ tin cậy</th>
                    <th className="px-6 py-4 whitespace-nowrap">Cảnh báo vi phạm</th>
                    <th className="px-6 py-4 text-center whitespace-nowrap">Can thiệp sự cố</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="transition-colors hover:bg-gray-50/60">
                      <td className="px-6 py-4 align-middle">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-gray-900">{session.studentName}</p>
                          <p className="text-xs text-blue-600">MSSV: {session.studentCode}</p>
                          <p className="text-xs text-gray-400">IP: {session.ipAddress}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <AppBadge
                          tone={sessionStatusTone[session.status]}
                          className={session.status === 'WARNING' ? 'font-medium animate-pulse' : 'font-medium'}
                        >
                          ● {session.status}
                        </AppBadge>
                      </td>

                      <td className="px-6 py-4 text-gray-700 align-middle">{session.progress}</td>

                      <td className="px-6 py-4 align-middle">
                        <div className="space-y-1">
                          <span
                            className={`text-xs font-medium ${
                              session.integrityScore >= 80
                                ? 'text-emerald-600'
                                : session.integrityScore >= 60
                                ? 'text-amber-600'
                                : 'text-rose-600'
                            }`}
                          >
                            {session.integrityScore}%
                          </span>
                          <div className="w-16 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                session.integrityScore >= 80
                                  ? 'bg-emerald-500'
                                  : session.integrityScore >= 60
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${session.integrityScore}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 align-middle">
                        {session.violationsCount > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-medium text-rose-600 flex items-center gap-1">
                              <AlertTriangle size={13} /> {session.violationsCount} vi phạm
                            </span>
                            <p className="text-xs text-gray-500">{session.lastViolation}</p>
                          </div>
                        ) : (
                          <span className="text-emerald-600 text-xs font-medium flex items-center gap-1">
                            <ShieldCheck size={14} /> Không có vi phạm
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setWarningTarget(session)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 border border-rose-200"
                            title="Gửi cảnh báo popup tới màn hình thí sinh"
                          >
                            <MessageSquare size={13} /> Cảnh báo
                          </button>

                          <button
                            onClick={() => openAction(session, 'ADD_TIME')}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                            title="Cộng thêm thời gian làm bài do sự cố"
                          >
                            <Plus size={13} /> Cộng giờ
                          </button>

                          {session.status !== 'SUBMITTED' && (
                            <button
                              onClick={() => openAction(session, 'FORCE_SUBMIT')}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                              title="Buộc nộp bài ngay"
                            >
                              <Lock size={13} /> Buộc nộp
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TeacherTablePanel>
        </main>
      </div>

      {/* Send Warning Modal */}
      {warningTarget && (
        <SendWarningModal
          isOpen={!!warningTarget}
          studentName={warningTarget.studentName}
          studentCode={warningTarget.studentCode}
          onClose={() => setWarningTarget(null)}
          onSend={handleSendWarning}
        />
      )}
      {actionTarget && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="border-b border-gray-100 p-5"><h2 className="text-lg font-bold text-gray-900">{actionType === 'ADD_TIME' ? 'Cộng Thêm Thời Gian' : 'Buộc Nộp Bài Ca Thi'}</h2><p className="mt-0.5 text-sm font-medium text-gray-500">{actionTarget.studentName} • {actionTarget.studentCode}</p></div>
            <div className="space-y-3 p-5 text-xs">
              {actionType === 'ADD_TIME' && <label className="block font-semibold text-gray-700">Số phút cộng thêm<input type="number" min={1} max={120} value={extraMinutes} onChange={(event) => setExtraMinutes(Number(event.target.value))} className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 font-bold text-blue-600 focus:outline-none focus:border-blue-500" /></label>}
              <label className="block font-semibold text-gray-700">Lý do điều chỉnh / Ghi chú sự cố<textarea rows={3} value={actionReason} onChange={(event) => setActionReason(event.target.value)} placeholder="Nhập lý do chi tiết..." className="mt-1 w-full rounded-xl border border-gray-200 p-2.5 focus:outline-none focus:border-blue-500" /></label>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-100 p-4"><button onClick={() => setActionTarget(null)} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200 transition-colors">Hủy bỏ</button><button disabled={actionReason.trim().length < 5 || (actionType === 'ADD_TIME' && extraMinutes < 1)} onClick={applyAction} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 shadow-xs transition-colors disabled:opacity-50">Xác nhận thực hiện</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
