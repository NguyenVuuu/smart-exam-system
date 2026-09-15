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

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
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
  }, [debouncedViolationSearch, scheduleId, selectedViolationStudentId, selectedViolationType, setScheduleTitle, setSessions, setViolationPagination, setViolations, stopLive, violationPage])

  const startLive = async (session: ProctoringSessionRecord, streamType: LiveStreamType) => {
    if (liveAttemptId && (liveAttemptId !== session.attemptId || liveStreamType !== streamType)) stopLive()
    onSwitchToLiveTab?.()
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
