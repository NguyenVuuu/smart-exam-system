import {
  AlertTriangle,
  Lock,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
} from 'lucide-react'
import { useState } from 'react'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import SendWarningModal from './components/exam-detail/SendWarningModal'

interface StudentSession {
  id: string
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
  const [selectedExamId, setSelectedExamId] = useState('exam-01')
  const [searchQuery, setSearchQuery] = useState('')

  // State for Warning modal
  const [warningTarget, setWarningTarget] = useState<StudentSession | null>(null)

  const totalOnline = sessions.filter((s) => s.status === 'ONLINE').length
  const totalWarning = sessions.filter((s) => s.status === 'WARNING').length
  const totalSubmitted = sessions.filter((s) => s.status === 'SUBMITTED').length

  const handleAddExtraTime = (studentName: string) => {
    const minutes = prompt(`Nhập số phút muốn cộng thêm cho sinh viên ${studentName} (Ví dụ: 5, 10):`, '5')
    if (!minutes) return
    const reason = prompt(`Nhập lý do sự cố:`, 'Sự cố mất kết nối mạng')
    if (!reason) return

    alert(`Đã cộng thêm +${minutes} phút cho sinh viên ${studentName}. Lý do: ${reason}`)
  }

  const handleForceSubmit = (studentName: string) => {
    const reason = prompt(`Nhập lý do buộc nộp bài đối với sinh viên ${studentName}:`, 'Vi phạm quy chế thi trực tuyến')
    if (!reason?.trim()) return

    if (confirm(`Xác nhận buộc nộp bài ngay đối với sinh viên ${studentName}?`)) {
      setSessions((prev) =>
        prev.map((s) => (s.studentName === studentName ? { ...s, status: 'SUBMITTED' } : s)),
      )
      alert(`Đã buộc nộp bài đối với sinh viên ${studentName}. Lý do: ${reason.trim()}`)
    }
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
    alert(`Đã gửi popup cảnh báo tới màn hình thí sinh ${warningTarget.studentName}!`)
    setWarningTarget(null)
  }

  const filteredSessions = sessions.filter(
    (s) =>
      s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-6">
          <TeacherPageHeader
            title="Giám Sát Ca Thi Trực Tuyến"
            description="Theo dõi phòng thi trực tiếp theo thời gian thực, nhận cảnh báo gian lận và can thiệp sự cố"
            titleContent={
              <AppBadge tone="rose" className="text-xs font-bold uppercase animate-pulse">
                ● LIVE
              </AppBadge>
            }
            actions={
              <>
              <AppSelect
                value={selectedExamId}
                onChange={setSelectedExamId}
                className="w-72"
                buttonClassName="text-gray-900"
                options={[
                  { value: 'exam-01', label: 'Thi Giữa Kỳ Java (Ca 1 • 08:00)' },
                  { value: 'exam-02', label: 'Thi Thực Hành C++ (Ca 2 • 10:00)' },
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
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Đang Làm Bài (Online)</span>
              <p className="text-2xl font-bold text-blue-600">{totalOnline}</p>
              <span className="text-[11px] text-gray-400">Kết nối ổn định</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Cảnh Báo Vi Phạm</span>
              <p className="text-2xl font-bold text-rose-600">{totalWarning}</p>
              <span className="text-[11px] text-rose-600 font-medium">Chuyển tab / Mất webcam</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Đã Nộp Bài</span>
              <p className="text-2xl font-bold text-emerald-600">{totalSubmitted}</p>
              <span className="text-[11px] text-gray-400">Hoàn thành bài thi</span>
            </div>

            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-1">
              <span className="text-[11px] font-semibold text-gray-500 block uppercase">Tổng Thí Sinh Ca Thi</span>
              <p className="text-2xl font-bold text-gray-900">{sessions.length}</p>
              <span className="text-[11px] text-gray-400">Phòng thi trực tuyến</span>
            </div>
          </div>

          {/* Sessions Live Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <h3 className="text-sm font-bold text-gray-900">Danh Sách Thí Sinh Trong Phòng Thi</h3>

              <div className="relative w-full sm:w-72">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm MSSV, họ tên thí sinh..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="border border-gray-100 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-[10px] border-b border-gray-100">
                  <tr>
                    <th className="p-4">Thí Sinh</th>
                    <th className="p-4">Trạng Thái</th>
                    <th className="p-4">Tiến Độ</th>
                    <th className="p-4">Độ Tin Cậy</th>
                    <th className="p-4">Cảnh Báo Vi Phạm</th>
                    <th className="p-4 text-center">Can Thiệp Sự Cố</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSessions.map((session) => (
                    <tr key={session.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-gray-900">{session.studentName}</p>
                          <p className="text-[11px] text-blue-600 font-medium">MSSV: {session.studentCode}</p>
                          <p className="text-[10px] text-gray-400">IP: {session.ipAddress}</p>
                        </div>
                      </td>

                      <td className="p-4">
                        <AppBadge
                          tone={sessionStatusTone[session.status]}
                          className={session.status === 'WARNING' ? 'font-bold animate-pulse' : 'font-bold'}
                        >
                          ● {session.status}
                        </AppBadge>
                      </td>

                      <td className="p-4 font-semibold text-gray-700">{session.progress}</td>

                      <td className="p-4">
                        <div className="space-y-1">
                          <span
                            className={`text-xs font-bold ${
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

                      <td className="p-4">
                        {session.violationsCount > 0 ? (
                          <div className="space-y-0.5">
                            <span className="text-xs font-bold text-rose-600 flex items-center gap-1">
                              <AlertTriangle size={13} /> {session.violationsCount} vi phạm
                            </span>
                            <p className="text-[10px] text-gray-500">{session.lastViolation}</p>
                          </div>
                        ) : (
                          <span className="text-emerald-600 text-[11px] font-medium flex items-center gap-1">
                            <ShieldCheck size={14} /> Không có vi phạm
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => setWarningTarget(session)}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 border border-rose-200"
                            title="Gửi cảnh báo popup tới màn hình thí sinh"
                          >
                            <MessageSquare size={13} /> Cảnh báo
                          </button>

                          <button
                            onClick={() => handleAddExtraTime(session.studentName)}
                            className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1 border border-blue-200"
                            title="Cộng thêm thời gian làm bài do sự cố"
                          >
                            <Plus size={13} /> Cộng giờ
                          </button>

                          {session.status !== 'SUBMITTED' && (
                            <button
                              onClick={() => handleForceSubmit(session.studentName)}
                              className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-[11px] rounded-lg transition-colors flex items-center gap-1"
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
          </div>
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
    </div>
  )
}
