import { AlertTriangle, Camera, Image, RefreshCw, ShieldAlert, Square, Video } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import AppBadge from '../../components/common/AppBadge'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import {
  addTeacherLiveCameraCandidate,
  endTeacherLiveCamera,
  getTeacherLiveCameraCandidates,
  getTeacherLiveCameraSession,
  getTeacherLiveProctoringSessions,
  getTeacherLiveProctoringViolations,
  startTeacherLiveCamera,
  submitTeacherLiveCameraAnswer,
} from './api/teacher-exams.api'
import type { ProctoringSessionRecord, ViolationRecord } from './types/teacher-exam.types'

type ProctoringTab = 'live' | 'violations'

const REFRESH_MS = 10_000
const SIGNAL_POLL_MS = 1_000
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

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

const severityTone = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'rose',
} as const

export default function TeacherLiveProctorPage() {
  const [params] = useSearchParams()
  const scheduleId = params.get('scheduleId') ?? ''
  const [activeTab, setActiveTab] = useState<ProctoringTab>('live')
  const [sessions, setSessions] = useState<ProctoringSessionRecord[]>([])
  const [violations, setViolations] = useState<ViolationRecord[]>([])
  const [scheduleTitle, setScheduleTitle] = useState('Ca thi')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null)
  const [liveAttemptId, setLiveAttemptId] = useState<string | null>(null)
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null)
  const [liveStatus, setLiveStatus] = useState<'IDLE' | 'REQUESTING' | 'CONNECTING' | 'CONNECTED'>('IDLE')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const liveSessionIdRef = useRef<string | null>(null)
  const candidateCursorRef = useRef(0)

  const load = useCallback(async () => {
    if (!scheduleId) return
    setLoading(true)
    try {
      const [sessionData, violationItems] = await Promise.all([
        getTeacherLiveProctoringSessions(scheduleId),
        getTeacherLiveProctoringViolations(scheduleId),
      ])
      setScheduleTitle(sessionData.schedule.title)
      setSessions(sessionData.items)
      setViolations(violationItems)
    } catch {
      toast.error('Không thể tải dữ liệu giám sát ca thi.')
    } finally {
      setLoading(false)
    }
  }, [scheduleId])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    if (!scheduleId) return
    const intervalId = window.setInterval(() => void load(), REFRESH_MS)
    return () => window.clearInterval(intervalId)
  }, [load, scheduleId])

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = remoteStream
  }, [remoteStream])

  const stopLive = useCallback(() => {
    const sessionId = liveSessionIdRef.current
    if (sessionId) void endTeacherLiveCamera(sessionId).catch(() => undefined)
    peerRef.current?.close()
    peerRef.current = null
    liveSessionIdRef.current = null
    candidateCursorRef.current = 0
    setRemoteStream(null)
    setLiveAttemptId(null)
    setLiveSessionId(null)
    setLiveStatus('IDLE')
  }, [])

  useEffect(() => () => {
    const sessionId = liveSessionIdRef.current
    if (sessionId) void endTeacherLiveCamera(sessionId).catch(() => undefined)
    peerRef.current?.close()
  }, [])

  useEffect(() => {
    if (!liveSessionId || !peerRef.current) return
    let cancelled = false

    const poll = async () => {
      const peer = peerRef.current
      if (cancelled || !peer) return

      const session = await getTeacherLiveCameraSession(liveSessionId).catch(() => null)
      if (!session || session.status === 'ENDED') {
        stopLive()
        return
      }

      if (session.offer && !peer.currentRemoteDescription) {
        setLiveStatus('CONNECTING')
        await peer.setRemoteDescription(session.offer)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        await submitTeacherLiveCameraAnswer(liveSessionId, answer)
      }

      const batch = await getTeacherLiveCameraCandidates(liveSessionId, candidateCursorRef.current).catch(() => null)
      if (!batch) return
      candidateCursorRef.current = batch.nextCursor
      for (const candidate of batch.candidates) {
        await peer.addIceCandidate(candidate).catch(() => undefined)
      }
    }

    void poll()
    const intervalId = window.setInterval(() => void poll(), SIGNAL_POLL_MS)
    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [liveSessionId, stopLive])

  const startLive = async (session: ProctoringSessionRecord) => {
    if (liveAttemptId && liveAttemptId !== session.attemptId) stopLive()
    setActiveTab('live')
    setLiveAttemptId(session.attemptId)
    setLiveStatus('REQUESTING')
    setRemoteStream(null)

    const peer = new RTCPeerConnection(RTC_CONFIG)
    peerRef.current = peer
    candidateCursorRef.current = 0

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0] ?? new MediaStream([event.track]))
      setLiveStatus('CONNECTED')
    }
    peer.onicecandidate = (event) => {
      const sessionId = liveSessionIdRef.current
      if (!event.candidate || !sessionId) return
      void addTeacherLiveCameraCandidate(sessionId, event.candidate.toJSON()).catch(() => undefined)
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setLiveStatus('CONNECTED')
      if (['failed', 'closed'].includes(peer.connectionState)) stopLive()
    }

    try {
      const liveSession = await startTeacherLiveCamera(session.attemptId)
      liveSessionIdRef.current = liveSession.id
      setLiveSessionId(liveSession.id)
      toast.success(`Đang mở camera của ${session.studentName}.`)
    } catch {
      stopLive()
      toast.error('Không thể mở camera sinh viên.')
    }
  }

  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi')
    return !keyword ||
      session.studentName.toLocaleLowerCase('vi').includes(keyword) ||
      session.studentCode.toLocaleLowerCase('vi').includes(keyword)
  }), [searchQuery, sessions])

  const filteredViolations = useMemo(() => violations.filter((violation) => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi')
    return !keyword ||
      violation.studentName.toLocaleLowerCase('vi').includes(keyword) ||
      violation.studentCode.toLocaleLowerCase('vi').includes(keyword) ||
      violation.type.toLocaleLowerCase('vi').includes(keyword)
  }), [searchQuery, violations])

  const liveStudent = sessions.find((session) => session.attemptId === liveAttemptId) ?? null
  const onlineCount = sessions.filter((session) => session.isOnline).length
  const cameraActiveCount = sessions.filter((session) => session.webcamStatus === 'ACTIVE').length

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />
        <main className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <TeacherPageHeader
            title="Giám sát ca thi"
            description={scheduleId ? scheduleTitle : 'Chọn một ca thi từ lịch coi thi để mở phòng giám sát.'}
            icon={<ShieldAlert size={21} />}
            actions={
              <button
                type="button"
                onClick={() => void load()}
                disabled={!scheduleId || loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={15} /> Làm mới
              </button>
            }
          />

          {!scheduleId ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
              Vào từ trang Lịch coi thi để hệ thống biết cần giám sát ca thi nào.
            </div>
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Online" value={onlineCount} tone="text-blue-600" />
                <Metric label="Camera đang bật" value={cameraActiveCount} tone="text-emerald-600" />
                <Metric label="Vi phạm trong ca" value={violations.length} tone="text-rose-600" />
              </div>

              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                <TabButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={<Video size={16} />} label="Live camera" />
                <TabButton active={activeTab === 'violations'} onClick={() => setActiveTab('violations')} icon={<AlertTriangle size={16} />} label={`Nhật ký vi phạm (${violations.length})`} />
              </div>

              {activeTab === 'live' ? (
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_430px]">
                  <TeacherTablePanel>
                    <TeacherToolbar
                      filters={<h3 className="text-sm font-semibold text-slate-950">Sinh viên đang làm bài</h3>}
                      searchValue={searchQuery}
                      onSearchChange={setSearchQuery}
                      searchPlaceholder="Tìm MSSV hoặc họ tên..."
                      onReset={() => setSearchQuery('')}
                    />
                    <StudentLiveTable
                      sessions={filteredSessions}
                      liveAttemptId={liveAttemptId}
                      onStartLive={startLive}
                      onStopLive={stopLive}
                    />
                  </TeacherTablePanel>

                  <LiveCameraPanel
                    liveStudent={liveStudent}
                    liveStatus={liveStatus}
                    liveSessionId={liveSessionId}
                    remoteStream={remoteStream}
                    videoRef={videoRef}
                  />
                </div>
              ) : (
                <TeacherTablePanel>
                  <TeacherToolbar
                    filters={<h3 className="text-sm font-semibold text-slate-950">Nhật ký bằng chứng vi phạm</h3>}
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Tìm MSSV, họ tên hoặc loại vi phạm..."
                    onReset={() => setSearchQuery('')}
                  />
                  <ViolationTable violations={filteredViolations} onViewEvidence={setEvidenceUrl} />
                </TeacherTablePanel>
              )}
            </>
          )}
        </main>
      </div>

      {evidenceUrl && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
              <h2 className="text-sm font-bold text-slate-900">Ảnh bằng chứng</h2>
              <button type="button" onClick={() => setEvidenceUrl(null)} className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                Đóng
              </button>
            </div>
            <div className="bg-slate-950 p-3">
              <img src={evidenceUrl} alt="Ảnh bằng chứng vi phạm" className="mx-auto max-h-[72vh] rounded-lg object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white px-5 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tone}`}>{value}</p>
    </div>
  )
}

function TabButton({ active, icon, label, onClick }: { active: boolean; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
        active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'
      }`}
    >
      {icon}
      {label}
    </button>
  )
}

function StudentLiveTable({
  sessions,
  liveAttemptId,
  onStartLive,
  onStopLive,
}: {
  sessions: ProctoringSessionRecord[]
  liveAttemptId: string | null
  onStartLive: (session: ProctoringSessionRecord) => void
  onStopLive: () => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-5 py-3">Sinh viên</th>
            <th className="whitespace-nowrap px-5 py-3">Online</th>
            <th className="whitespace-nowrap px-5 py-3">Camera</th>
            <th className="whitespace-nowrap px-5 py-3">Tiến độ</th>
            <th className="whitespace-nowrap px-5 py-3 text-right">Live</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {sessions.map((session) => (
            <tr key={session.attemptId} className={liveAttemptId === session.attemptId ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'}>
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">{session.studentName}</p>
                <p className="text-xs text-blue-600">MSSV: {session.studentCode}</p>
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={session.isOnline ? 'blue' : 'gray'}>{session.isOnline ? 'Online' : 'Offline'}</AppBadge>
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={webcamTone[session.webcamStatus]}>{webcamLabel[session.webcamStatus]}</AppBadge>
              </td>
              <td className="px-5 py-4 text-slate-600">{session.answeredCount}/{session.totalQuestionCount}</td>
              <td className="px-5 py-4 text-right">
                {liveAttemptId === session.attemptId ? (
                  <button type="button" onClick={onStopLive} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    <Square size={14} /> Ngắt
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onStartLive(session)}
                    disabled={!session.isOnline || session.webcamStatus !== 'ACTIVE'}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Video size={14} /> Xem camera
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sessions.length === 0 && <EmptyState text="Chưa có sinh viên phù hợp." />}
    </div>
  )
}

function LiveCameraPanel({
  liveStudent,
  liveStatus,
  liveSessionId,
  remoteStream,
  videoRef,
}: {
  liveStudent: ProctoringSessionRecord | null
  liveStatus: 'IDLE' | 'REQUESTING' | 'CONNECTING' | 'CONNECTED'
  liveSessionId: string | null
  remoteStream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">Camera đang xem</h2>
        <p className="mt-1 text-xs text-slate-500">
          {liveStudent ? `${liveStudent.studentName} · ${liveStudent.studentCode}` : 'Chưa chọn sinh viên'}
        </p>
      </div>
      <div className="aspect-video bg-slate-950">
        {remoteStream ? (
          <video ref={videoRef} autoPlay playsInline muted className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
            <Camera size={34} />
            <span className="text-sm">{liveStatus === 'IDLE' ? 'Chọn một sinh viên để xem live camera' : 'Đang mở camera sinh viên...'}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-500">
        <span>Trạng thái: {liveStatus}</span>
        {liveSessionId && <span>Session: {liveSessionId.slice(0, 8)}</span>}
      </div>
    </section>
  )
}

function ViolationTable({ violations, onViewEvidence }: { violations: ViolationRecord[]; onViewEvidence: (url: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-5 py-3">Thời gian</th>
            <th className="whitespace-nowrap px-5 py-3">Sinh viên</th>
            <th className="whitespace-nowrap px-5 py-3">Loại vi phạm</th>
            <th className="whitespace-nowrap px-5 py-3">Mức độ</th>
            <th className="whitespace-nowrap px-5 py-3">Thời lượng</th>
            <th className="whitespace-nowrap px-5 py-3 text-right">Bằng chứng</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {violations.map((violation) => (
            <tr key={violation.id} className="hover:bg-gray-50/70">
              <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDateTime(violation.timestamp)}</td>
              <td className="px-5 py-4">
                <p className="font-semibold text-slate-900">{violation.studentName}</p>
                <p className="text-xs text-blue-600">MSSV: {violation.studentCode}</p>
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={violation.type === 'TAB_SWITCH' ? 'amber' : 'rose'}>{formatViolationType(violation.type)}</AppBadge>
              </td>
              <td className="px-5 py-4">
                <AppBadge tone={severityTone[violation.severity]}>{violation.severity}</AppBadge>
              </td>
              <td className="whitespace-nowrap px-5 py-4 text-slate-600">{formatDuration(violation)}</td>
              <td className="px-5 py-4 text-right">
                {violation.evidenceImageUrl ? (
                  <button type="button" onClick={() => onViewEvidence(violation.evidenceImageUrl!)} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100">
                    <Image size={14} /> Xem ảnh
                  </button>
                ) : (
                  <span className="text-xs text-slate-400">Không có ảnh</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {violations.length === 0 && <EmptyState text="Chưa ghi nhận vi phạm nào trong ca thi này." />}
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="px-6 py-10 text-center text-sm text-gray-500">{text}</div>
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(new Date(value))
}

function formatDuration(violation: ViolationRecord) {
  if (violation.durationSeconds === null && violation.endedAt === null) return 'Đang diễn ra'
  const seconds = violation.durationSeconds
  if (seconds === undefined || seconds === null) return '-'
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest > 0 ? `${minutes}m ${rest}s` : `${minutes}m`
}

function formatViolationType(type: ViolationRecord['type']) {
  const labels: Partial<Record<ViolationRecord['type'], string>> = {
    TAB_SWITCH: 'Chuyển tab',
    FULLSCREEN_EXIT: 'Thoát toàn màn hình',
    COPY_PASTE: 'Sao chép/dán',
    NO_FACE: 'Không thấy mặt',
    MULTIPLE_FACES: 'Nhiều khuôn mặt',
    CAMERA_BLOCKED: 'Camera bị chặn',
    CAMERA_DISCONNECTED: 'Camera mất kết nối',
    CAMERA_PERMISSION_DENIED: 'Mất quyền camera',
    SCREEN_SHARE_STOPPED: 'Dừng chia sẻ màn hình',
    SCREEN_PERMISSION_DENIED: 'Mất quyền màn hình',
    INACTIVITY: 'Không hoạt động',
  }
  return labels[type] ?? type
}
