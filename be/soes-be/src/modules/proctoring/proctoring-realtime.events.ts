type ProctoringEmitter = {
  emitToSchedule(scheduleId: string, event: string, payload: unknown): void
  emitToAttempt(attemptId: string, event: string, payload: unknown): void
  emitToTeacher(teacherId: string, event: string, payload: unknown): void
  emitToStudent(studentId: string, event: string, payload: unknown): void
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

export function emitTeacherEvent(teacherId: string, event: string, payload: unknown) {
  emitter?.emitToTeacher(teacherId, event, payload)
}

export function emitStudentEvent(studentId: string, event: string, payload: unknown) {
  emitter?.emitToStudent(studentId, event, payload)
}
