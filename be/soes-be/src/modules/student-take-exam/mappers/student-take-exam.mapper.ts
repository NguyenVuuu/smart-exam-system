import type { StartExamResult } from '../types'
import type { StartExamResponseDto } from '../dtos/student-take-exam.dto'

export function toStartExamResponseDto(result: StartExamResult): StartExamResponseDto {
  return {
    attemptId:        result.attemptId,
    startedAt:        result.startedAt.toISOString(),
    attemptEndAt:     result.attemptEndAt.toISOString(),
    remainingSeconds: result.remainingSeconds,
  }
}
