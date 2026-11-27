const handlers = new Map()
const sessions = Array.from({ length: 500 }, (_, index) => ({
  attemptId: `fixture-${index}`, scheduleId: 'schedule', studentId: `student-${index}`,
  studentCode: `US${index}`, studentName: `Fixture ${index}`, attemptStatus: 'IN_PROGRESS',
  isOnline: false, ipAddress: null, webcamStatus: 'DISCONNECTED', screenShareStatus: 'STOPPED',
  lastHeartbeatAt: '2026-11-27T00:00:00Z', lastWebcamHeartbeatAt: null, lastScreenHeartbeatAt: null,
  answeredCount: 0, totalQuestionCount: 10, violationCount: 0, lastViolation: null,
}))
const socket = {
  connected: true,
  on(event, handler) { const set = handlers.get(event) ?? new Set(); set.add(handler); handlers.set(event, set) },
  off(event, handler) { handlers.get(event)?.delete(handler) },
  emit(event, ...args) {
    if (event === 'proctoring:join_schedule') args.at(-1)({ ok: true, data: { schedule: { title: 'Fixture' }, items: sessions } })
  },
}
window.addEventListener('fixture:heartbeat', event => {
  for (const handler of handlers.get('student:heartbeat') ?? []) handler(event.detail)
})
export function getSocket() { return socket }
export function updateSocketAuthToken() {}
export function disconnectSocket() { socket.connected = false }
