import { createRoot } from 'react-dom/client'
import { usePhoneViolationMonitor } from '../../../src/pages/student/hooks/take-exam/usePhoneViolationMonitor'
import { useAuthStore } from '../../../src/store/authStore'

useAuthStore.getState().setUser({ id: 'fixture-owner', profileId: 'fixture', fullName: 'Fixture', email: null,
  avatarUrl: null, role: 'STUDENT', studentCode: 'fixture', teacherCode: null, adminCode: null })
const canvas = document.createElement('canvas')
canvas.width = 32
canvas.height = 24
canvas.getContext('2d')?.fillRect(0, 0, 32, 24)
const stream = canvas.captureStream(1)

export function Fixture() {
  const error = usePhoneViolationMonitor({ enabled: true, attemptId: 'fixture-attempt', scheduleId: 'fixture-schedule', stream })
  return <output aria-label="queue-status">{error ?? 'ready'}</output>
}
const root = document.getElementById('root')
if (!root) throw new Error('Fixture root missing')
createRoot(root).render(<Fixture />)
