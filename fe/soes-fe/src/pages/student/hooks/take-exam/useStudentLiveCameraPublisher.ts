import { useEffect, useRef } from 'react'
import { getSocket } from '../../../../api/socket'
import { takeExamApi, type LiveCameraSession } from '../../api/student-take-exam.api'

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function useStudentLiveStreamPublisher(input: {
  enabled: boolean
  scheduleId: string
  attemptId: string
  stream: MediaStream | null
  streamType: 'WEBCAM' | 'SCREEN'
}) {
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  useEffect(() => {
    const hasLiveVideo = input.stream?.getVideoTracks().some((track) => track.readyState === 'live' && track.enabled)
    if (!input.enabled || !input.scheduleId || !input.attemptId || !hasLiveVideo) return

    let cancelled = false
    const socket = getSocket()

    const cleanupPeer = () => {
      peerRef.current?.close()
      peerRef.current = null
      sessionIdRef.current = null
    }

    const startSession = async (sessionId: string) => {
      if (peerRef.current || !input.stream) return

      const peer = new RTCPeerConnection(RTC_CONFIG)
      peerRef.current = peer
      sessionIdRef.current = sessionId

      input.stream.getVideoTracks().forEach((track) => {
        peer.addTrack(track, input.stream!)
      })

      peer.onicecandidate = (event) => {
        if (!event.candidate) return
        socket.emit('live:student_candidate', {
          scheduleId: input.scheduleId,
          attemptId: input.attemptId,
          sessionId,
          candidate: event.candidate.toJSON(),
        })
      }

      peer.onconnectionstatechange = () => {
        if (['failed', 'closed'].includes(peer.connectionState)) {
          cleanupPeer()
        }
      }

      const offer = await peer.createOffer({
        offerToReceiveAudio: false,
        offerToReceiveVideo: false,
      })
      await peer.setLocalDescription(offer)
      socket.emit('live:student_offer', {
        scheduleId: input.scheduleId,
        attemptId: input.attemptId,
        sessionId,
        offer,
      })
    }

    const handleLiveRequest = (request: LiveCameraSession) => {
      if (cancelled || peerRef.current) return
      if (request.attemptId !== input.attemptId || request.scheduleId !== input.scheduleId) return
      if ((request.streamType ?? 'WEBCAM') !== input.streamType) return
      void startSession(request.id).catch(cleanupPeer)
    }

    const handleLiveAnswer = async (session: LiveCameraSession) => {
      const peer = peerRef.current
      if (cancelled || !peer || session.id !== sessionIdRef.current) return
      if (session.answer && !peer.currentRemoteDescription) {
        await peer.setRemoteDescription(session.answer).catch(() => undefined)
      }
    }

    const handleTeacherCandidate = async ({ sessionId, candidate }: { sessionId: string; candidate: RTCIceCandidateInit }) => {
      if (cancelled || sessionId !== sessionIdRef.current) return
      await peerRef.current?.addIceCandidate(candidate).catch(() => undefined)
    }

    const handleLiveEnded = (session: LiveCameraSession) => {
      if (session.id === sessionIdRef.current) cleanupPeer()
    }

    socket.emit('proctoring:join_attempt', { scheduleId: input.scheduleId, attemptId: input.attemptId })
    socket.on('live:request', handleLiveRequest)
    socket.on('live:answer', handleLiveAnswer)
    socket.on('live:teacher_candidate', handleTeacherCandidate)
    socket.on('live:ended', handleLiveEnded)

    return () => {
      cancelled = true
      socket.off('live:request', handleLiveRequest)
      socket.off('live:answer', handleLiveAnswer)
      socket.off('live:teacher_candidate', handleTeacherCandidate)
      socket.off('live:ended', handleLiveEnded)
      const sessionId = sessionIdRef.current
      if (sessionId) {
        void takeExamApi.endStudentLiveSession(input.scheduleId, input.attemptId, sessionId).catch(() => undefined)
      }
      cleanupPeer()
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream, input.streamType])
}

export const useStudentLiveCameraPublisher = useStudentLiveStreamPublisher
