import { AlertTriangle, CalendarClock, Camera, ClockPlus, Image, MonitorUp, RefreshCw, ShieldAlert, Square, Video, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { getSocket } from '../../api/socket'
import AppBadge from '../../components/common/AppBadge'
import AppSelect from '../../components/common/AppSelect'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherPagination from './components/TeacherPagination'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTablePanel from './components/TeacherTablePanel'
import TeacherToolbar from './components/TeacherToolbar'
import TeacherTopBar from './components/TeacherTopBar'
import { useTeacherProctorAssignments } from './hooks/useTeacherProctorAssignments'
import {
  captureTeacherLiveEvidence,
  endTeacherLiveCamera,
  extendTeacherAttemptTime,
  getTeacherLiveProctoringSessions,
  getTeacherLiveProctoringViolations,
  startTeacherLiveCamera,
} from './api/teacher-exams.api'
import type { ProctoringSessionRecord, ViolationRecord } from './types/teacher-exam.types'
import type { TeacherPaginationMeta } from './api/teacher-exams.api'
import type { ProctorAssignmentApiDto, ProctorAssignmentStatus } from './types/teacher-course-api.types'

type ProctoringTab = 'live' | 'violations'
type LiveStreamType = 'WEBCAM' | 'SCREEN'
type LiveStatus = 'IDLE' | 'REQUESTING' | 'CONNECTING' | 'CONNECTED'

const REFRESH_MS = 10_000
const VIOLATION_PAGE_SIZE = 20
const emptyViolationPagination: TeacherPaginationMeta = {
  page: 1,
  pageSize: VIOLATION_PAGE_SIZE,
  totalItems: 0,
  totalPages: 1,
}
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

const severityTone = {
  LOW: 'blue',
  MEDIUM: 'amber',
  HIGH: 'rose',
} as const

const assignmentStatusMeta: Record<ProctorAssignmentStatus, { label: string; tone: 'blue' | 'emerald' | 'gray' | 'rose' }> = {
  SCHEDULED: { label: 'Đã lên lịch', tone: 'blue' },
  OPEN: { label: 'Đang diễn ra', tone: 'emerald' },
  CLOSED: { label: 'Đã kết thúc', tone: 'gray' },
  CANCELLED: { label: 'Đã hủy', tone: 'rose' },
}

const ASSIGNMENT_STATUS_PRIORITY: Record<ProctorAssignmentStatus, number> = {
  OPEN: 1,
  SCHEDULED: 2,
  CLOSED: 3,
  CANCELLED: 4,
}

const violationTypeLabels: Partial<Record<ViolationRecord['type'], string>> = {
  TAB_SWITCH: 'Chuyển tab',
  FULLSCREEN_EXIT: 'Thoát toàn màn hình',
  COPY_PASTE: 'Sao chép/dán',
  RIGHT_CLICK: 'Chuột phải',
  NO_FACE: 'Không thấy mặt',
  MULTIPLE_FACES: 'Nhiều khuôn mặt',
  LOOKING_AWAY: 'Nhìn lệch khỏi màn hình',
  CAMERA_BLOCKED: 'Camera bị chặn',
  CAMERA_DISCONNECTED: 'Camera mất kết nối',
  CAMERA_PERMISSION_DENIED: 'Mất quyền camera',
  SCREEN_SHARE_STOPPED: 'Dừng chia sẻ màn hình',
  SCREEN_PERMISSION_DENIED: 'Mất quyền màn hình',
  PROCTOR_WEBCAM_CAPTURE: 'Giảng viên chụp webcam',
  PROCTOR_SCREEN_CAPTURE: 'Giảng viên chụp màn hình',
  INACTIVITY: 'Không hoạt động',
}

function normalizeRealtimeViolation(payload: Partial<ViolationRecord> & {
  violationType?: ViolationRecord['type']
  detectedAt?: string
}): ViolationRecord | null {
  const timestamp = payload.timestamp ?? payload.detectedAt
  const type = payload.type ?? payload.violationType
  if (!payload.id || !payload.attemptId || !timestamp || !type || !payload.severity) return null

  return {
    id: payload.id,
    scheduleId: payload.scheduleId ?? '',
    attemptId: payload.attemptId,
    studentId: payload.studentId ?? '',
    studentCode: payload.studentCode ?? 'N/A',
    studentName: payload.studentName ?? 'Sinh viên',
    type,
    timestamp,
    endedAt: payload.endedAt ?? null,
    durationSeconds: payload.durationSeconds ?? null,
    severity: payload.severity,
    evidenceImageUrl: payload.evidenceImageUrl,
    note: payload.note,
  }
}

export default function TeacherLiveProctorPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const scheduleId = params.get('scheduleId') ?? ''
  const assignmentsData = useTeacherProctorAssignments()
  const [activeTab, setActiveTab] = useState<ProctoringTab>('live')
  const [sessions, setSessions] = useState<ProctoringSessionRecord[]>([])
  const [violations, setViolations] = useState<ViolationRecord[]>([])
  const [scheduleTitle, setScheduleTitle] = useState('Ca thi')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedViolationStudentId, setSelectedViolationStudentId] = useState('ALL')
  const [selectedViolationType, setSelectedViolationType] = useState<'ALL' | ViolationRecord['type']>('ALL')
  const [violationPage, setViolationPage] = useState(1)
  const [violationPagination, setViolationPagination] = useState<TeacherPaginationMeta>(emptyViolationPagination)
  const [loading, setLoading] = useState(false)
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null)
  const [liveAttemptId, setLiveAttemptId] = useState<string | null>(null)
  const [liveStreamType, setLiveStreamType] = useState<LiveStreamType>('WEBCAM')
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('IDLE')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const [extensionTarget, setExtensionTarget] = useState<ProctoringSessionRecord | null>(null)
  const [isExtendingTime, setIsExtendingTime] = useState(false)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const liveSessionIdRef = useRef<string | null>(null)

  const load = useCallback(async () => {
    if (!scheduleId) return
    setLoading(true)
    try {
      const [sessionData, violationItems] = await Promise.all([
        getTeacherLiveProctoringSessions(scheduleId),
        getTeacherLiveProctoringViolations(scheduleId, {
          page: violationPage,
          pageSize: VIOLATION_PAGE_SIZE,
          studentId: selectedViolationStudentId === 'ALL' ? undefined : selectedViolationStudentId,
          violationType: selectedViolationType === 'ALL' ? undefined : selectedViolationType,
        }),
      ])
      setScheduleTitle(sessionData.schedule.title)
      setSessions(sessionData.items)
      setViolations(violationItems.items)
      setViolationPagination(violationItems.pagination)
    } catch {
      toast.error('Không thể tải dữ liệu giám sát ca thi.')
    } finally {
      setLoading(false)
    }
  }, [scheduleId, selectedViolationStudentId, selectedViolationType, violationPage])

  useEffect(() => { void load() }, [load])

  useEffect(() => {
    setSelectedViolationStudentId('ALL')
    setSelectedViolationType('ALL')
    setViolationPage(1)
    setViolationPagination(emptyViolationPagination)
  }, [scheduleId])

  useEffect(() => {
    if (!scheduleId) return
    const intervalId = window.setInterval(() => void load(), REFRESH_MS)
    return () => window.clearInterval(intervalId)
  }, [load, scheduleId])

  useEffect(() => {
    setViolationPage(1)
  }, [selectedViolationStudentId, selectedViolationType])

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = remoteStream
  }, [remoteStream])

  const stopLive = useCallback(() => {
    const sessionId = liveSessionIdRef.current
    if (sessionId) {
      getSocket().emit('live:end', { sessionId })
      void endTeacherLiveCamera(sessionId).catch(() => undefined)
    }
    peerRef.current?.close()
    peerRef.current = null
    liveSessionIdRef.current = null
    setRemoteStream(null)
    setLiveAttemptId(null)
    setLiveStreamType('WEBCAM')
    setLiveSessionId(null)
    setLiveStatus('IDLE')
  }, [])

  useEffect(() => () => {
    const sessionId = liveSessionIdRef.current
    if (sessionId) void endTeacherLiveCamera(sessionId).catch(() => undefined)
    peerRef.current?.close()
  }, [])

  useEffect(() => {
    if (!scheduleId) return
    const socket = getSocket()

    socket.emit('proctoring:join_schedule', { scheduleId }, (response: { ok: boolean; data?: { schedule: { title: string }; items: ProctoringSessionRecord[] }; error?: string }) => {
      if (!response.ok) return
      if (response.data) {
        setScheduleTitle(response.data.schedule.title)
        setSessions(response.data.items)
      }
    })

    const handleHeartbeat = (payload: {
      attemptId: string
      webcamStatus?: ProctoringSessionRecord['webcamStatus']
      screenShareStatus?: ProctoringSessionRecord['screenShareStatus']
      lastHeartbeatAt?: string
      isOnline?: boolean
    }) => {
      setSessions((current) => current.map((item) => item.attemptId === payload.attemptId
        ? {
            ...item,
            isOnline: payload.isOnline ?? item.isOnline,
            webcamStatus: payload.webcamStatus ?? item.webcamStatus,
            screenShareStatus: payload.screenShareStatus ?? item.screenShareStatus,
            lastHeartbeatAt: payload.lastHeartbeatAt ?? item.lastHeartbeatAt,
          }
        : item))
    }

    const handleOffline = (payload: { attemptId: string; lastHeartbeatAt?: string; isOnline: false }) => {
      setSessions((current) => current.map((item) => item.attemptId === payload.attemptId
        ? { ...item, isOnline: false, lastHeartbeatAt: payload.lastHeartbeatAt ?? item.lastHeartbeatAt }
        : item))
    }
    const handleViolationCreated = (payload: ViolationRecord) => {
      const violation = normalizeRealtimeViolation(payload)
      if (!violation) return
      const matchesActiveViolationFilters =
        violationPage === 1 &&
        (selectedViolationStudentId === 'ALL' || violation.studentId === selectedViolationStudentId) &&
        (selectedViolationType === 'ALL' || violation.type === selectedViolationType)

      if (matchesActiveViolationFilters) {
        setViolations((current) => {
          if (current.some((item) => item.id === violation.id)) return current
          return [violation, ...current].slice(0, violationPagination.pageSize)
        })
        setViolationPagination((current) => ({
          ...current,
          totalItems: current.totalItems + 1,
          totalPages: Math.max(1, Math.ceil((current.totalItems + 1) / current.pageSize)),
        }))
      }
      setSessions((current) => current.map((item) => item.attemptId === violation.attemptId
        ? { ...item, violationCount: item.violationCount + 1 }
        : item))
    }
    const handleViolationEnded = (payload: Pick<ViolationRecord, 'id' | 'endedAt' | 'durationSeconds'>) => {
      setViolations((current) => current.map((item) => item.id === payload.id ? { ...item, ...payload } : item))
    }
    const handleLiveOffer = async (session: { id: string; status: string; offer: RTCSessionDescriptionInit | null }) => {
      const peer = peerRef.current
      if (!peer || session.id !== liveSessionIdRef.current || !session.offer || peer.currentRemoteDescription) return
      setLiveStatus('CONNECTING')
      await peer.setRemoteDescription(session.offer)
      const answer = await peer.createAnswer()
      await peer.setLocalDescription(answer)
      socket.emit('live:teacher_answer', { sessionId: session.id, answer })
    }
    const handleStudentCandidate = async ({ sessionId, candidate }: { sessionId: string; candidate: RTCIceCandidateInit }) => {
      if (sessionId !== liveSessionIdRef.current) return
      await peerRef.current?.addIceCandidate(candidate).catch(() => undefined)
    }
    const handleLiveEnded = (session: { id: string }) => {
      if (session.id === liveSessionIdRef.current) stopLive()
    }

    socket.on('student:heartbeat', handleHeartbeat)
    socket.on('student:offline', handleOffline)
    socket.on('violation:created', handleViolationCreated)
    socket.on('violation:ended', handleViolationEnded)
    socket.on('live:offer', handleLiveOffer)
    socket.on('live:student_candidate', handleStudentCandidate)
    socket.on('live:ended', handleLiveEnded)

    return () => {
      socket.off('student:heartbeat', handleHeartbeat)
      socket.off('student:offline', handleOffline)
      socket.off('violation:created', handleViolationCreated)
      socket.off('violation:ended', handleViolationEnded)
      socket.off('live:offer', handleLiveOffer)
      socket.off('live:student_candidate', handleStudentCandidate)
      socket.off('live:ended', handleLiveEnded)
    }
  }, [scheduleId, selectedViolationStudentId, selectedViolationType, stopLive, violationPage, violationPagination.pageSize])

  const startLive = async (session: ProctoringSessionRecord, streamType: LiveStreamType) => {
    if (liveAttemptId && (liveAttemptId !== session.attemptId || liveStreamType !== streamType)) stopLive()
    setActiveTab('live')
    setLiveAttemptId(session.attemptId)
    setLiveStreamType(streamType)
    setLiveStatus('REQUESTING')
    setRemoteStream(null)

    const peer = new RTCPeerConnection(RTC_CONFIG)
    peerRef.current = peer

    peer.ontrack = (event) => {
      setRemoteStream(event.streams[0] ?? new MediaStream([event.track]))
      setLiveStatus('CONNECTED')
    }
    peer.onicecandidate = (event) => {
      const sessionId = liveSessionIdRef.current
      if (!event.candidate || !sessionId) return
      getSocket().emit('live:teacher_candidate', { sessionId, candidate: event.candidate.toJSON() })
    }
    peer.onconnectionstatechange = () => {
      if (peer.connectionState === 'connected') setLiveStatus('CONNECTED')
      if (['failed', 'closed'].includes(peer.connectionState)) stopLive()
    }

    try {
      const eventName = streamType === 'SCREEN' ? 'live:request_screen' : 'live:request_camera'
      const liveSession = await new Promise<Awaited<ReturnType<typeof startTeacherLiveCamera>>>((resolve, reject) => {
        getSocket().emit(eventName, { attemptId: session.attemptId }, (response: { ok: boolean; data?: Awaited<ReturnType<typeof startTeacherLiveCamera>>; error?: string }) => {
          if (response.ok && response.data) resolve(response.data)
          else reject(new Error(response.error ?? 'Unable to request live stream'))
        })
      })
      liveSessionIdRef.current = liveSession.id
      setLiveSessionId(liveSession.id)
      toast.success(streamType === 'SCREEN' ? `Đang mở màn hình của ${session.studentName}.` : `Đang mở camera của ${session.studentName}.`)
    } catch {
      stopLive()
      toast.error(streamType === 'SCREEN' ? 'Không thể mở màn hình sinh viên.' : 'Không thể mở camera sinh viên.')
    }
  }

  const filteredSessions = useMemo(() => sessions.filter((session) => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi')
    return !keyword ||
      session.studentName.toLocaleLowerCase('vi').includes(keyword) ||
      session.studentCode.toLocaleLowerCase('vi').includes(keyword)
  }), [searchQuery, sessions])

  const violationStudentOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả sinh viên' },
    ...sessions
      .map((session) => ({
        value: session.studentId,
        label: `${session.studentCode} - ${session.studentName}`,
      }))
      .sort((first, second) => first.label.localeCompare(second.label, 'vi')),
  ], [sessions])

  const violationTypeOptions = useMemo(() => [
    { value: 'ALL', label: 'Tất cả loại vi phạm' },
    ...Object.entries(violationTypeLabels)
      .map(([value, label]) => ({ value, label: label ?? value }))
      .sort((first, second) => first.label.localeCompare(second.label, 'vi')),
  ], [])

  const filteredViolations = useMemo(() => violations.filter((violation) => {
    const keyword = searchQuery.trim().toLocaleLowerCase('vi')
    const matchesKeyword = !keyword ||
      violation.studentName.toLocaleLowerCase('vi').includes(keyword) ||
      violation.studentCode.toLocaleLowerCase('vi').includes(keyword) ||
      violation.type.toLocaleLowerCase('vi').includes(keyword)

    return matchesKeyword
  }), [searchQuery, violations])

  const selectableAssignments = useMemo(() => assignmentsData.assignments
    .filter((assignment) => assignment.status !== 'CANCELLED')
    .sort((first, second) => {
      const firstPriority = ASSIGNMENT_STATUS_PRIORITY[first.status] ?? 99
      const secondPriority = ASSIGNMENT_STATUS_PRIORITY[second.status] ?? 99
      if (firstPriority !== secondPriority) return firstPriority - secondPriority
      return new Date(first.startTime).getTime() - new Date(second.startTime).getTime()
    }), [assignmentsData.assignments])

  const openProctoringAssignment = useCallback((assignment: ProctorAssignmentApiDto) => {
    navigate(`/teacher/proctoring?scheduleId=${encodeURIComponent(assignment.scheduleId)}&courseOfferingId=${encodeURIComponent(assignment.courseOffering.id)}`)
  }, [navigate])

  const extendAttemptTime = useCallback(async (extraMinutes: number, reason: string) => {
    if (!extensionTarget) return
    setIsExtendingTime(true)
    try {
      const result = await extendTeacherAttemptTime(extensionTarget.attemptId, extraMinutes, reason)
      toast.success(`Đã gia hạn ${result.extraMinutes} phút cho ${result.studentName}. Hạn mới: ${formatDateTime(result.newDeadline)}.`)
      setExtensionTarget(null)
      await load()
    } catch {
      toast.error('Không thể gia hạn thời gian làm bài.')
    } finally {
      setIsExtendingTime(false)
    }
  }, [extensionTarget, load])

  const captureManualLiveEvidence = useCallback(async () => {
    if (!liveAttemptId || !remoteStream || !videoRef.current) return
    const video = videoRef.current
    if (!video.videoWidth || !video.videoHeight) {
      toast.error('Chưa có khung hình để chụp bằng chứng.')
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.9))
    if (!blob) {
      toast.error('Không thể tạo ảnh bằng chứng.')
      return
    }

    try {
      const fileName = `${liveStreamType.toLowerCase()}-capture-${Date.now()}.jpg`
      const violation = await captureTeacherLiveEvidence(liveAttemptId, liveStreamType, new File([blob], fileName, { type: 'image/jpeg' }))
      const matchesActiveViolationFilters =
        violationPage === 1 &&
        (selectedViolationStudentId === 'ALL' || violation.studentId === selectedViolationStudentId) &&
        (selectedViolationType === 'ALL' || violation.type === selectedViolationType)
      if (matchesActiveViolationFilters) {
        setViolations((current) => {
          if (current.some((item) => item.id === violation.id)) return current
          return [violation, ...current].slice(0, violationPagination.pageSize)
        })
        setViolationPagination((current) => ({
          ...current,
          totalItems: current.totalItems + 1,
          totalPages: Math.max(1, Math.ceil((current.totalItems + 1) / current.pageSize)),
        }))
      }
      setSessions((current) => current.map((item) => item.attemptId === violation.attemptId
        ? { ...item, violationCount: item.violationCount + 1 }
        : item))
      toast.success(liveStreamType === 'SCREEN' ? 'Đã chụp bằng chứng màn hình.' : 'Đã chụp bằng chứng webcam.')
    } catch {
      toast.error('Không thể lưu bằng chứng thủ công.')
    }
  }, [liveAttemptId, liveStreamType, remoteStream, selectedViolationStudentId, selectedViolationType, violationPage, violationPagination.pageSize])

  const liveStudent = sessions.find((session) => session.attemptId === liveAttemptId) ?? null
  const onlineCount = sessions.filter((session) => session.isOnline).length
  const cameraActiveCount = sessions.filter((session) => session.webcamStatus === 'ACTIVE').length
  const screenActiveCount = sessions.filter((session) => session.screenShareStatus === 'ACTIVE').length
  const totalViolationCount = sessions.reduce((total, session) => total + session.violationCount, 0)

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
                onClick={() => { scheduleId ? void load() : void assignmentsData.retry() }}
                disabled={scheduleId ? loading : assignmentsData.loading}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw size={15} /> Làm mới
              </button>
            }
          />

          {!scheduleId ? (
            <ProctoringAssignmentPicker
              assignments={selectableAssignments}
              loading={assignmentsData.loading}
              error={assignmentsData.error}
              onRetry={assignmentsData.retry}
              onOpen={openProctoringAssignment}
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="Online" value={onlineCount} tone="text-blue-600" />
                <Metric label="Camera đang bật" value={cameraActiveCount} tone="text-emerald-600" />
                <Metric label="Màn hình đang chia sẻ" value={screenActiveCount} tone="text-cyan-600" />
                <Metric label="Vi phạm trong ca" value={totalViolationCount} tone="text-rose-600" />
              </div>

              <div className="flex flex-wrap gap-2 border-b border-gray-200">
                <TabButton active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={<Video size={16} />} label="Live proctoring" />
                <TabButton active={activeTab === 'violations'} onClick={() => setActiveTab('violations')} icon={<AlertTriangle size={16} />} label={`Nhật ký vi phạm (${totalViolationCount})`} />
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
                      liveStreamType={liveStreamType}
                      onStartLive={startLive}
                      onStopLive={stopLive}
                      onExtendTime={setExtensionTarget}
                    />
                  </TeacherTablePanel>

                  <LiveStreamPanel
                    liveStudent={liveStudent}
                    liveStatus={liveStatus}
                    liveSessionId={liveSessionId}
                    liveStreamType={liveStreamType}
                    remoteStream={remoteStream}
                    videoRef={videoRef}
                    onCapture={captureManualLiveEvidence}
                  />
                </div>
              ) : (
                <TeacherTablePanel>
                  <TeacherToolbar
                    filters={
                      <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center">
                        <h3 className="text-sm font-semibold text-slate-950">Nhật ký bằng chứng vi phạm</h3>
                        <AppSelect
                          value={selectedViolationStudentId}
                          options={violationStudentOptions}
                          onChange={setSelectedViolationStudentId}
                          disabled={violationStudentOptions.length <= 1}
                          placeholder="Lọc theo sinh viên"
                          className="w-full sm:w-72"
                          buttonClassName="rounded-lg"
                        />
                        <AppSelect
                          value={selectedViolationType}
                          options={violationTypeOptions}
                          onChange={(value) => setSelectedViolationType(value as 'ALL' | ViolationRecord['type'])}
                          placeholder="Lọc theo loại vi phạm"
                          className="w-full sm:w-64"
                          buttonClassName="rounded-lg"
                        />
                      </div>
                    }
                    searchValue={searchQuery}
                    onSearchChange={setSearchQuery}
                    searchPlaceholder="Tìm MSSV, họ tên hoặc loại vi phạm..."
                    onReset={() => {
                      setSearchQuery('')
                      setSelectedViolationStudentId('ALL')
                      setSelectedViolationType('ALL')
                      setViolationPage(1)
                    }}
                  />
                  <ViolationTable violations={filteredViolations} onViewEvidence={setEvidenceUrl} />
                  <TeacherPagination
                    page={violationPagination.page}
                    totalPages={violationPagination.totalPages}
                    totalItems={violationPagination.totalItems}
                    onChange={setViolationPage}
                  />
                </TeacherTablePanel>
              )}
            </>
          )}
        </main>
      </div>

      {extensionTarget && (
        <ExtendTimeModal
          session={extensionTarget}
          submitting={isExtendingTime}
          onClose={() => setExtensionTarget(null)}
          onSubmit={extendAttemptTime}
        />
      )}

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

function ProctoringAssignmentPicker({
  assignments,
  loading,
  error,
  onRetry,
  onOpen,
}: {
  assignments: ProctorAssignmentApiDto[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onOpen: (assignment: ProctorAssignmentApiDto) => void
}) {
  if (loading) return <EmptyState text="Đang tải các ca coi thi được phân công..." />

  if (error) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center text-sm text-slate-500 shadow-sm">
        <span>{error}</span>
        <button type="button" onClick={onRetry} className="inline-flex items-center gap-2 font-semibold text-blue-600 hover:text-blue-700">
          <RefreshCw size={15} /> Thử lại
        </button>
      </div>
    )
  }

  if (assignments.length === 0) {
    return (
      <div className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-2xl border border-gray-100 bg-white px-6 py-10 text-center shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <CalendarClock size={22} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-900">Chưa có ca coi thi để giám sát</h2>
          <p className="mt-1 text-sm text-slate-500">Các ca được phân công sẽ xuất hiện tại đây khi lịch thi được mở.</p>
        </div>
      </div>
    )
  }

  return (
    <TeacherTablePanel>
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">Chọn ca thi để mở phòng giám sát</h2>
        <p className="mt-1 text-xs text-slate-500">Ưu tiên hiển thị ca đang diễn ra, sau đó đến các ca sắp tới.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
            <tr>
              <th className="whitespace-nowrap px-5 py-3">Ca thi</th>
              <th className="whitespace-nowrap px-5 py-3">Lớp học phần</th>
              <th className="whitespace-nowrap px-5 py-3">Thời gian</th>
              <th className="whitespace-nowrap px-5 py-3">Trạng thái</th>
              <th className="whitespace-nowrap px-5 py-3 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {assignments.map((assignment) => {
              const meta = assignmentStatusMeta[assignment.status]
              return (
                <tr key={assignment.id} className="hover:bg-gray-50/70">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-900">{assignment.title}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{assignment.courseOffering.subjectName}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{assignment.courseOffering.code}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-slate-700">{formatAssignmentTime(assignment)}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <AppBadge tone={meta.tone}>{meta.label}</AppBadge>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => onOpen(assignment)}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                    >
                      <ShieldAlert size={14} /> Mở giám sát
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </TeacherTablePanel>
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
  liveStreamType,
  onStartLive,
  onStopLive,
  onExtendTime,
}: {
  sessions: ProctoringSessionRecord[]
  liveAttemptId: string | null
  liveStreamType: LiveStreamType
  onStartLive: (session: ProctoringSessionRecord, streamType: LiveStreamType) => void
  onStopLive: () => void
  onExtendTime: (session: ProctoringSessionRecord) => void
}) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse text-left text-sm">
        <thead className="border-y border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase text-slate-500">
          <tr>
            <th className="whitespace-nowrap px-5 py-3">Sinh viên</th>
            <th className="whitespace-nowrap px-5 py-3">Online</th>
            <th className="whitespace-nowrap px-5 py-3">Camera</th>
            <th className="whitespace-nowrap px-5 py-3">Màn hình</th>
            <th className="whitespace-nowrap px-5 py-3">Tiến độ</th>
            <th className="whitespace-nowrap px-5 py-3 text-right">Thao tác</th>
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
              <td className="px-5 py-4">
                <AppBadge tone={screenTone[session.screenShareStatus]}>{screenLabel[session.screenShareStatus]}</AppBadge>
              </td>
              <td className="px-5 py-4 text-slate-600">{session.answeredCount}/{session.totalQuestionCount}</td>
              <td className="px-5 py-4 text-right">
                <div className="flex flex-wrap justify-end gap-2">
                {liveAttemptId === session.attemptId ? (
                  <button type="button" onClick={onStopLive} className="inline-flex items-center gap-2 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100">
                    <Square size={14} /> {liveStreamType === 'SCREEN' ? 'Ngắt màn hình' : 'Ngắt camera'}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => onStartLive(session, 'WEBCAM')}
                      disabled={!session.isOnline || session.webcamStatus !== 'ACTIVE'}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Video size={14} /> Camera
                    </button>
                    <button
                      type="button"
                      onClick={() => onStartLive(session, 'SCREEN')}
                      disabled={!session.isOnline || session.screenShareStatus !== 'ACTIVE'}
                      className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <MonitorUp size={14} /> Màn hình
                    </button>
                  </>
                )}
                  <button
                    type="button"
                    onClick={() => onExtendTime(session)}
                    disabled={session.attemptStatus !== 'IN_PROGRESS'}
                    className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <ClockPlus size={14} /> Gia hạn
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sessions.length === 0 && <EmptyState text="Chưa có sinh viên phù hợp." />}
    </div>
  )
}

function LiveStreamPanel({
  liveStudent,
  liveStatus,
  liveSessionId,
  liveStreamType,
  remoteStream,
  videoRef,
  onCapture,
}: {
  liveStudent: ProctoringSessionRecord | null
  liveStatus: LiveStatus
  liveSessionId: string | null
  liveStreamType: LiveStreamType
  remoteStream: MediaStream | null
  videoRef: React.RefObject<HTMLVideoElement | null>
  onCapture: () => void
}) {
  const isScreen = liveStreamType === 'SCREEN'
  return (
    <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-bold text-slate-900">{isScreen ? 'Màn hình đang xem' : 'Camera đang xem'}</h2>
        <p className="mt-1 text-xs text-slate-500">
          {liveStudent ? `${liveStudent.studentName} · ${liveStudent.studentCode}` : 'Chưa chọn sinh viên'}
        </p>
      </div>
      <div className="aspect-video bg-slate-950">
        {remoteStream ? (
          <video ref={videoRef} autoPlay playsInline muted className={`h-full w-full ${isScreen ? 'object-contain' : 'object-cover'}`} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-3 text-slate-300">
            {isScreen ? <MonitorUp size={34} /> : <Camera size={34} />}
            <span className="text-sm">{liveStatus === 'IDLE' ? (isScreen ? 'Chọn sinh viên để xem màn hình' : 'Chọn sinh viên để xem live camera') : (isScreen ? 'Đang mở màn hình sinh viên...' : 'Đang mở camera sinh viên...')}</span>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between px-5 py-4 text-xs text-slate-500">
        <span>Trạng thái: {liveStatus}</span>
        <div className="flex items-center gap-3">
          {remoteStream && (
            <button type="button" onClick={onCapture} className="inline-flex items-center gap-2 rounded-lg bg-blue-50 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-100">
              <Image size={14} /> Chụp bằng chứng
            </button>
          )}
          {liveSessionId && <span>Session: {liveSessionId.slice(0, 8)}</span>}
        </div>
      </div>
    </section>
  )
}

function ExtendTimeModal({
  session,
  submitting,
  onClose,
  onSubmit,
}: {
  session: ProctoringSessionRecord
  submitting: boolean
  onClose: () => void
  onSubmit: (extraMinutes: number, reason: string) => void
}) {
  const [extraMinutes, setExtraMinutes] = useState(10)
  const [reasonType, setReasonType] = useState('Lỗi chia sẻ màn hình')
  const [note, setNote] = useState('')
  const reason = `${reasonType}${note.trim() ? ` - ${note.trim()}` : ''}`
  const canSubmit = extraMinutes >= 1 && extraMinutes <= 180 && reason.trim().length >= 3 && !submitting

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-5 py-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Gia hạn thời gian làm bài</h2>
            <p className="mt-1 text-xs text-slate-500">{session.studentName} · MSSV: {session.studentCode}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            aria-label="Đóng"
          >
            <X size={17} />
          </button>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[5, 10, 15, 30].map((minutes) => (
              <button
                key={minutes}
                type="button"
                onClick={() => setExtraMinutes(minutes)}
                className={`rounded-xl border px-4 py-3 text-sm font-bold transition-colors ${
                  extraMinutes === minutes
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 bg-white text-slate-700 hover:bg-gray-50'
                }`}
              >
                +{minutes} phút
              </button>
            ))}
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2">
              <span className="text-xs font-semibold text-slate-500">Khác</span>
              <input
                type="number"
                min={1}
                max={180}
                value={extraMinutes}
                onChange={(event) => setExtraMinutes(Number(event.target.value))}
                className="min-w-0 flex-1 bg-transparent text-sm font-bold text-slate-900 outline-none"
              />
            </label>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Lý do</label>
            <select
              value={reasonType}
              onChange={(event) => setReasonType(event.target.value)}
              className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-800 outline-none focus:border-blue-400"
            >
              <option>Lỗi chia sẻ màn hình</option>
              <option>Mất kết nối mạng</option>
              <option>Vào thi muộn có xác nhận</option>
              <option>Lỗi camera</option>
              <option>Sự cố thiết bị</option>
              <option>Sự cố khác</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold uppercase text-slate-500">Ghi chú</label>
            <textarea
              value={note}
              onChange={(event) => setNote(event.target.value)}
              rows={3}
              placeholder="Ví dụ: Sinh viên báo mất màn hình share từ 08:12 đến 08:18."
              className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-400"
            />
          </div>

          <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
            Thao tác này chỉ áp dụng cho sinh viên được chọn và sẽ được lưu vào lịch sử xử lý của attempt.
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
          >
            Hủy
          </button>
          <button
            type="button"
            onClick={() => onSubmit(extraMinutes, reason)}
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClockPlus size={16} /> {submitting ? 'Đang gia hạn...' : 'Xác nhận gia hạn'}
          </button>
        </div>
      </div>
    </div>
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

function formatAssignmentTime(assignment: ProctorAssignmentApiDto) {
  const start = new Date(assignment.startTime)
  if (Number.isNaN(start.getTime())) return '-'

  const date = new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(start)

  return `${date} · ${formatTimeOnly(assignment.startTime)} - ${formatTimeOnly(assignment.endTime)}`
}

function formatDateTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    day: '2-digit',
    month: '2-digit',
  }).format(date)
}

function formatTimeOnly(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '--:--'
  return new Intl.DateTimeFormat('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
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
    RIGHT_CLICK: 'Chuột phải',
    NO_FACE: 'Không thấy mặt',
    MULTIPLE_FACES: 'Nhiều khuôn mặt',
    LOOKING_AWAY: 'Nhìn lệch khỏi màn hình',
    CAMERA_BLOCKED: 'Camera bị chặn',
    CAMERA_DISCONNECTED: 'Camera mất kết nối',
    CAMERA_PERMISSION_DENIED: 'Mất quyền camera',
    SCREEN_SHARE_STOPPED: 'Dừng chia sẻ màn hình',
    SCREEN_PERMISSION_DENIED: 'Mất quyền màn hình',
    PROCTOR_WEBCAM_CAPTURE: 'Giảng viên chụp webcam',
    PROCTOR_SCREEN_CAPTURE: 'Giảng viên chụp màn hình',
    INACTIVITY: 'Không hoạt động',
  }
  return labels[type] ?? type
}
