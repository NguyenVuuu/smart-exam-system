import { Profiler, useState } from 'react'
import { createRoot } from 'react-dom/client'
import StudentLiveTable from '../../../src/pages/teacher/components/proctoring/StudentLiveTable'
import { useLiveProctorSocket } from '../../../src/pages/teacher/hooks/useLiveProctorSocket'
import type { ProctoringSessionRecord, ViolationRecord } from '../../../src/pages/teacher/types/teacher-exam.types'

declare global {
  interface Window { proctorProfile: { commits: number; durationMs: number } }
}
window.proctorProfile = { commits: 0, durationMs: 0 }

export function Fixture() {
  const [sessions, setSessions] = useState<ProctoringSessionRecord[]>([])
  const [, setViolations] = useState<ViolationRecord[]>([])
  const [, setViolationPagination] = useState({ page: 1, pageSize: 20, totalItems: 0, totalPages: 1 })
  const [, setScheduleTitle] = useState('')
  const live = useLiveProctorSocket({ scheduleId: 'schedule', violationPage: 1, debouncedViolationSearch: '',
    selectedViolationStudentId: 'ALL', selectedViolationType: 'ALL',
    setSessions, setViolations, setViolationPagination, setScheduleTitle })
  const flood = () => {
    for (let index = 0; index < 500; index++) {
      window.dispatchEvent(new CustomEvent('fixture:heartbeat', { detail: { attemptId: `fixture-${index}`,
        lastHeartbeatAt: '2026-11-27T00:00:02Z', isOnline: true, webcamStatus: 'ACTIVE' } }))
      window.dispatchEvent(new CustomEvent('fixture:heartbeat', { detail: { attemptId: `fixture-${index}`,
        lastHeartbeatAt: '2026-11-27T00:00:01Z', isOnline: false, webcamStatus: 'DISCONNECTED' } }))
    }
  }
  return <>
    <button onClick={flood}>Flood 500</button>
    <output aria-label="online">{sessions.filter(item => item.isOnline && item.webcamStatus === 'ACTIVE').length}</output>
    <StudentLiveTable sessions={sessions} liveAttemptId={live.liveAttemptId} liveStreamType={live.liveStreamType}
      onStartLive={() => undefined} onStopLive={live.stopLive} onExtendTime={() => undefined} onForceSubmit={() => undefined} />
  </>
}
const root = document.getElementById('root')
if (!root) throw new Error('Fixture root missing')
createRoot(root).render(<Profiler id="proctor" onRender={(_id, _phase, duration) => {
  window.proctorProfile.commits++
  window.proctorProfile.durationMs += duration
}}><Fixture /></Profiler>)
