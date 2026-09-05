import { useEffect, useRef } from 'react'
import { takeExamApi } from '../../api/student-take-exam.api'
import { isExamWebcamStreamLive } from '../../utils/exam-webcam'

const REQUEST_POLL_MS = 2_000
const SIGNAL_POLL_MS = 1_000
const RTC_CONFIG: RTCConfiguration = {
  iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
}

export function useStudentLiveCameraPublisher(input: {
  enabled: boolean
  scheduleId: string
  attemptId: string
  stream: MediaStream | null
}) {
  const peerRef = useRef<RTCPeerConnection | null>(null)
  const sessionIdRef = useRef<string | null>(null)
  const teacherCandidateCursorRef = useRef(0)

  useEffect(() => {
    if (!input.enabled || !input.scheduleId || !input.attemptId || !isExamWebcamStreamLive(input.stream)) return

    let cancelled = false

    const cleanupPeer = () => {
      peerRef.current?.close()
      peerRef.current = null
      sessionIdRef.current = null
      teacherCandidateCursorRef.current = 0
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
        void takeExamApi.addStudentLiveCandidate(
          input.scheduleId,
          input.attemptId,
          sessionId,
          event.candidate.toJSON(),
        ).catch(() => undefined)
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
      await takeExamApi.submitLiveCameraOffer(input.scheduleId, input.attemptId, sessionId, offer)
    }

    const pollRequest = async () => {
      if (cancelled || peerRef.current) return
      const request = await takeExamApi.getPendingLiveCameraRequest(input.scheduleId, input.attemptId).catch(() => null)
      if (!request || request.status !== 'REQUESTED') return
      await startSession(request.id).catch(cleanupPeer)
    }

    const pollSignal = async () => {
      const sessionId = sessionIdRef.current
      const peer = peerRef.current
      if (cancelled || !sessionId || !peer) return

      const session = await takeExamApi.getStudentLiveSession(input.scheduleId, input.attemptId, sessionId).catch(() => null)
      if (!session || session.status === 'ENDED') {
        cleanupPeer()
        return
      }

      if (session.answer && !peer.currentRemoteDescription) {
        await peer.setRemoteDescription(session.answer).catch(() => undefined)
      }

      const candidateBatch = await takeExamApi
        .getStudentLiveCandidates(input.scheduleId, input.attemptId, sessionId, teacherCandidateCursorRef.current)
        .catch(() => null)
      if (!candidateBatch) return

      teacherCandidateCursorRef.current = candidateBatch.nextCursor
      for (const candidate of candidateBatch.candidates) {
        await peer.addIceCandidate(candidate).catch(() => undefined)
      }
    }

    void pollRequest()
    const requestIntervalId = window.setInterval(() => void pollRequest(), REQUEST_POLL_MS)
    const signalIntervalId = window.setInterval(() => void pollSignal(), SIGNAL_POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(requestIntervalId)
      window.clearInterval(signalIntervalId)
      const sessionId = sessionIdRef.current
      if (sessionId) {
        void takeExamApi.endStudentLiveSession(input.scheduleId, input.attemptId, sessionId).catch(() => undefined)
      }
      cleanupPeer()
    }
  }, [input.attemptId, input.enabled, input.scheduleId, input.stream])
}
