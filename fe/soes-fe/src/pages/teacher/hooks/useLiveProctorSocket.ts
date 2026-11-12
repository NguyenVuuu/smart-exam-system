import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { getSocket } from '../../../api/socket'
import {
  captureTeacherLiveEvidence,
  endTeacherLiveCamera,
  startTeacherLiveCamera,
} from '../api/teacher-exams.api'
import type { ProctoringSessionRecord, ViolationRecord } from '../types/teacher-exam.types'
import type { TeacherPaginationMeta } from '../api/teacher-exams.api'
import type { LiveStatus } from '../components/proctoring/LiveStreamPanel'
import type { LiveStreamType } from '../components/proctoring/StudentLiveTable'
import { getRtcConfiguration } from '../../../utils/rtc-configuration'

type LiveOffer = { id: string; status: string; offer: RTCSessionDescriptionInit | null }

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
    metadata: payload.metadata,
    reviewStatus: payload.reviewStatus ?? 'PENDING',
    note: payload.note,
  }
}

function matchesViolationKeyword(violation: ViolationRecord, keyword: string) {
  if (!keyword) return true
  const normalizedKeyword = keyword.toLocaleLowerCase('vi')
  return violation.studentName.toLocaleLowerCase('vi').includes(normalizedKeyword) ||
    violation.studentCode.toLocaleLowerCase('vi').includes(normalizedKeyword)
}

export interface UseLiveProctorSocketOptions {
  scheduleId: string
  violationPage: number
  debouncedViolationSearch: string
  selectedViolationStudentId: string
  selectedViolationType: 'ALL' | ViolationRecord['type']
  setSessions: React.Dispatch<React.SetStateAction<ProctoringSessionRecord[]>>
  setViolations: React.Dispatch<React.SetStateAction<ViolationRecord[]>>
  setViolationPagination: React.Dispatch<React.SetStateAction<TeacherPaginationMeta>>
  setScheduleTitle: React.Dispatch<React.SetStateAction<string>>
  onSwitchToLiveTab?: () => void
}

export function useLiveProctorSocket({
  scheduleId,
  violationPage,
  debouncedViolationSearch,
  selectedViolationStudentId,
  selectedViolationType,
  setSessions,
  setViolations,
  setViolationPagination,
  setScheduleTitle,
  onSwitchToLiveTab,
}: UseLiveProctorSocketOptions) {
  const [liveAttemptId, setLiveAttemptId] = useState<string | null>(null)
  const [liveStreamType, setLiveStreamType] = useState<LiveStreamType>('WEBCAM')
  const [liveSessionId, setLiveSessionId] = useState<string | null>(null)
  const [liveStatus, setLiveStatus] = useState<LiveStatus>('IDLE')
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const liveSessionIdRef = useRef<string | null>(null)
  const requestTimerRef = useRef<number | null>(null)
  const requestGenerationRef = useRef(0)
  const streamReadyRef = useRef(false)
  const pendingOfferRef = useRef<LiveOffer | null>(null)
  const handleLiveOfferRef = useRef<((session: LiveOffer) => Promise<void>) | null>(null)
  const visionAlertsRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (!videoRef.current) return
    videoRef.current.srcObject = remoteStream
  }, [remoteStream])

  const stopLive = useCallback(() => {
    requestGenerationRef.current++
    if (requestTimerRef.current !== null) window.clearTimeout(requestTimerRef.current)
    requestTimerRef.current = null
    streamReadyRef.current = false
    pendingOfferRef.current = null
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
    if (requestTimerRef.current !== null) window.clearTimeout(requestTimerRef.current)
    const sessionId = liveSessionIdRef.current
    if (sessionId) void endTeacherLiveCamera(sessionId).catch(() => undefined)
    peerRef.current?.close()
  }, [])

  useEffect(() => {
    if (!scheduleId) return
    const socket = getSocket()

    const joinSchedule = () => {
      socket.emit('proctoring:join_schedule', { scheduleId }, (response: { ok: boolean; data?: { schedule: { title: string }; items: ProctoringSessionRecord[] }; error?: string }) => {
        if (!response.ok) return
        if (response.data) {
          setScheduleTitle(response.data.schedule.title)
          setSessions(response.data.items)
        }
      })
    }
    if (socket.connected) joinSchedule()
    socket.on('connect', joinSchedule)
    const handleDisconnect = () => {
      if (!liveSessionIdRef.current) return
      stopLive()
      toast.warning('Kết nối giám sát bị ngắt. Hãy mở lại luồng trực tiếp sau khi kết nối khôi phục.')
    }
    socket.on('disconnect', handleDisconnect)

    const handleHeartbeat = (payload: {
      attemptId: string
      webcamStatus?: ProctoringSessionRecord['webcamStatus']
      screenShareStatus?: ProctoringSessionRecord['screenShareStatus']
      visionStatus?: ProctoringSessionRecord['visionStatus']
      lastHeartbeatAt?: string
      isOnline?: boolean
    }) => {
      setSessions((current) => current.map((item) => item.attemptId === payload.attemptId
        ? {
            ...item,
            isOnline: payload.isOnline ?? item.isOnline,
            webcamStatus: payload.webcamStatus ?? item.webcamStatus,
            screenShareStatus: payload.screenShareStatus ?? item.screenShareStatus,
            visionStatus: payload.visionStatus ?? item.visionStatus,
            lastHeartbeatAt: payload.lastHeartbeatAt ?? item.lastHeartbeatAt,
          }
        : item))
      if (payload.visionStatus === 'UNAVAILABLE' && !visionAlertsRef.current.has(payload.attemptId)) {
        visionAlertsRef.current.add(payload.attemptId)
        toast.warning('Nhận diện camera trên máy sinh viên tạm ngừng', {
          description: 'Vẫn có thể mở camera trực tiếp để kiểm tra trong khi sinh viên tiếp tục làm bài.',
        })
      } else if (payload.visionStatus === 'READY') {
        visionAlertsRef.current.delete(payload.attemptId)
      }
    }

    const handleOffline = (payload: {
      attemptId: string
      attemptStatus?: ProctoringSessionRecord['attemptStatus']
      lastHeartbeatAt?: string
      isOnline: false
    }) => {
      setSessions((current) => current.map((item) => item.attemptId === payload.attemptId
        ? {
            ...item,
            attemptStatus: payload.attemptStatus ?? item.attemptStatus,
            isOnline: false,
            webcamStatus: item.webcamStatus === 'ACTIVE' ? 'DISCONNECTED' : item.webcamStatus,
            screenShareStatus: item.screenShareStatus === 'ACTIVE' ? 'STOPPED' : item.screenShareStatus,
            lastHeartbeatAt: payload.lastHeartbeatAt ?? item.lastHeartbeatAt,
          }
        : item))
      if (payload.attemptId === liveAttemptId) stopLive()
      visionAlertsRef.current.delete(payload.attemptId)
    }

    const handleViolationCreated = (payload: ViolationRecord) => {
      const violation = normalizeRealtimeViolation(payload)
      if (!violation) return
      const matchesActiveViolationFilters =
        violationPage === 1 &&
        matchesViolationKeyword(violation, debouncedViolationSearch) &&
        (selectedViolationStudentId === 'ALL' || violation.studentId === selectedViolationStudentId) &&
        (selectedViolationType === 'ALL' || violation.type === selectedViolationType)

      if (matchesActiveViolationFilters) {
        setViolations((current) => {
          if (current.some((item) => item.id === violation.id)) return current
          return [violation, ...current].slice(0, 10)
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

    const handleLiveOffer = async (session: LiveOffer) => {
      if (!liveSessionIdRef.current) {
        pendingOfferRef.current = session
        return
      }
      const peer = peerRef.current
      if (!peer || session.id !== liveSessionIdRef.current || !session.offer || peer.currentRemoteDescription) return
      try {
        setLiveStatus('CONNECTING')
        await peer.setRemoteDescription(session.offer)
        const answer = await peer.createAnswer()
        await peer.setLocalDescription(answer)
        socket.timeout(8_000).emit('live:teacher_answer', { sessionId: session.id, answer }, (error: Error | null, response: { ok: boolean }) => {
          if (!error && response?.ok) return
          stopLive()
          toast.error('Không thể thiết lập luồng trực tiếp. Vui lòng thử lại.')
        })
      } catch {
        stopLive()
        toast.error('Không thể xử lý tín hiệu camera/màn hình. Vui lòng thử lại.')
      }
    }
    handleLiveOfferRef.current = handleLiveOffer

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
      socket.off('connect', joinSchedule)
      socket.off('disconnect', handleDisconnect)
      socket.off('student:heartbeat', handleHeartbeat)
      socket.off('student:offline', handleOffline)
      socket.off('violation:created', handleViolationCreated)
      socket.off('violation:ended', handleViolationEnded)
      socket.off('live:offer', handleLiveOffer)
      socket.off('live:student_candidate', handleStudentCandidate)
      socket.off('live:ended', handleLiveEnded)
      handleLiveOfferRef.current = null
    }
  }, [debouncedViolationSearch, liveAttemptId, scheduleId, selectedViolationStudentId, selectedViolationType, setScheduleTitle, setSessions, setViolationPagination, setViolations, stopLive, violationPage])

  useEffect(() => {
    if (!liveSessionId) return
    const keepAlive = () => getSocket().timeout(8_000).emit('live:keepalive', { sessionId: liveSessionId }, (error: Error | null, response: { ok: boolean }) => {
      if (!error && response?.ok) return
      stopLive()
      toast.error('Phiên xem trực tiếp đã ngắt. Vui lòng mở lại.')
    })
    const timer = window.setInterval(keepAlive, 60_000)
    return () => window.clearInterval(timer)
  }, [liveSessionId, stopLive])

  const startLive = async (session: ProctoringSessionRecord, streamType: LiveStreamType) => {
    if (liveAttemptId && (liveAttemptId !== session.attemptId || liveStreamType !== streamType)) stopLive()
    if (!getSocket().connected) {
      toast.error('Chưa kết nối được máy chủ giám sát. Vui lòng thử lại.')
      return
    }
    const requestGeneration = ++requestGenerationRef.current
    streamReadyRef.current = false
    pendingOfferRef.current = null
    onSwitchToLiveTab?.()
    setLiveAttemptId(session.attemptId)
    setLiveStreamType(streamType)
    setLiveStatus('REQUESTING')
    setRemoteStream(null)

    const peer = new RTCPeerConnection(getRtcConfiguration())
    peerRef.current = peer

    peer.ontrack = (event) => {
      if (requestGeneration !== requestGenerationRef.current) return
      streamReadyRef.current = true
      if (requestTimerRef.current !== null) window.clearTimeout(requestTimerRef.current)
      requestTimerRef.current = null
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
        getSocket().timeout(8_000).emit(eventName, { attemptId: session.attemptId }, (timeoutError: Error | null, response: { ok: boolean; data?: Awaited<ReturnType<typeof startTeacherLiveCamera>>; error?: string }) => {
          if (timeoutError) { reject(new Error('Máy chủ giám sát không phản hồi trong 8 giây.')); return }
          if (response.ok && response.data) resolve(response.data)
          else reject(new Error(response.error ?? 'Unable to request live stream'))
        })
      })
      if (requestGeneration !== requestGenerationRef.current) {
        void endTeacherLiveCamera(liveSession.id).catch(() => undefined)
        return
      }
      liveSessionIdRef.current = liveSession.id
      setLiveSessionId(liveSession.id)
      const pendingOffer = pendingOfferRef.current as LiveOffer | null
      pendingOfferRef.current = null
      if (pendingOffer?.id === liveSession.id) void handleLiveOfferRef.current?.(pendingOffer)
      if (!streamReadyRef.current) requestTimerRef.current = window.setTimeout(() => {
        if (requestGeneration !== requestGenerationRef.current) return
        stopLive()
        toast.error('Không nhận được hình ảnh trực tiếp trong 20 giây. Hãy kiểm tra kết nối của sinh viên rồi thử lại.')
      }, 20_000)
      toast.success(streamType === 'SCREEN' ? `Đang mở màn hình của ${session.studentName}.` : `Đang mở camera của ${session.studentName}.`)
    } catch (error) {
      stopLive()
      const reason = error instanceof Error ? error.message : ''
      toast.error(streamType === 'SCREEN' ? 'Không thể mở màn hình sinh viên.' : 'Không thể mở camera sinh viên.', {
        description: reason || 'Không nhận được phản hồi từ máy chủ. Vui lòng thử lại.',
      })
    }
  }

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
        matchesViolationKeyword(violation, debouncedViolationSearch) &&
        (selectedViolationStudentId === 'ALL' || violation.studentId === selectedViolationStudentId) &&
        (selectedViolationType === 'ALL' || violation.type === selectedViolationType)
      if (matchesActiveViolationFilters) {
        setViolations((current) => {
          if (current.some((item) => item.id === violation.id)) return current
          return [violation, ...current].slice(0, 10)
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
  }, [debouncedViolationSearch, liveAttemptId, liveStreamType, remoteStream, selectedViolationStudentId, selectedViolationType, setSessions, setViolationPagination, setViolations, violationPage])

  return {
    liveAttemptId,
    liveStreamType,
    liveSessionId,
    liveStatus,
    remoteStream,
    videoRef,
    startLive,
    stopLive,
    captureManualLiveEvidence,
  }
}
