import type { AccountRole } from '../../utils/jwt'

export const scheduleRoom = (scheduleId: string) => `proctoring:schedule:${scheduleId}`
export const attemptRoom = (attemptId: string) => `proctoring:attempt:${attemptId}`
export const isTeacherRole = (role: AccountRole) => role === 'TEACHER' || role === 'DEPARTMENT_HEAD'

export function joinStudentAttemptRoom(socket: { join(room: string): void | Promise<void> }, attemptId: string) {
  return socket.join(attemptRoom(attemptId))
}
