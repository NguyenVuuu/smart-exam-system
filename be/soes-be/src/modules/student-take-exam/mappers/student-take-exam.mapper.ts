import type { StartExamResult, ExamContentResult } from '../types'
import type { StartExamResponseDto, GetExamContentResponseDto } from '../dtos/student-take-exam.dto'

export function toStartExamResponseDto(result: StartExamResult): StartExamResponseDto {
  return {
    attemptId:        result.attemptId,
    startedAt:        result.startedAt.toISOString(),
    attemptEndAt:     result.attemptEndAt.toISOString(),
    remainingSeconds: result.remainingSeconds,
  }
}

// ─── API 2: Get Exam Content ──────────────────────────────────────────────────

export function toGetExamContentResponseDto(result: ExamContentResult): GetExamContentResponseDto {
  return {
    attemptId:        result.attemptId,
    title:            result.title,
    durationMinutes:  result.durationMinutes,
    remainingSeconds: result.remainingSeconds,
    questions:        result.questions,
  }
}
