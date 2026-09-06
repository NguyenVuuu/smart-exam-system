type ProctoringEmitter = {
  emitToSchedule(scheduleId: string, event: string, payload: unknown): void
  emitToAttempt(attemptId: string, event: string, payload: unknown): void
}

let emitter: ProctoringEmitter | null = null

export function setProctoringEmitter(nextEmitter: ProctoringEmitter) {
  emitter = nextEmitter
}

export function emitProctoringEvent(scheduleId: string, event: string, payload: unknown) {
  emitter?.emitToSchedule(scheduleId, event, payload)
}

export function emitAttemptEvent(attemptId: string, event: string, payload: unknown) {
  emitter?.emitToAttempt(attemptId, event, payload)
}
