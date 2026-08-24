import type { StartExamResult, ExamContentResult, ExamContentQuestion, SubmitExamResult, AttemptStatusResult } from '../types'
import type { StartExamResponseDto, GetExamContentResponseDto, ExamContentQuestionDto, SaveAnswerResponseDto, SubmitExamResponseDto, GetAttemptStatusResponseDto } from '../dtos/student-take-exam.dto'

export function toStartExamResponseDto(result: StartExamResult): StartExamResponseDto {
  return {
    attemptId:        result.attemptId,
    startedAt:        result.startedAt.toISOString(),
    attemptEndAt:     result.attemptEndAt.toISOString(),
    remainingSeconds: result.remainingSeconds,
  }
}

// ─── API 2: Get Exam Content ─────────────────────────────────────────────────

function toExamContentQuestionDto(q: ExamContentQuestion): ExamContentQuestionDto {
  if (q.type === 'PROGRAMMING') {
    return {
      id:              q.id,
      orderIndex:      q.orderIndex,
      content:         q.content,
      type:            'PROGRAMMING',
      points:          q.points,
      draftSourceCode: q.draftSourceCode,
    }
  }
  return {
    id:         q.id,
    orderIndex: q.orderIndex,
    content:    q.content,
    type:       q.type,
    points:     q.points,
    options:    q.options,
    answer:     q.answer,
  }
}

export function toGetExamContentResponseDto(result: ExamContentResult): GetExamContentResponseDto {
  return {
    attemptId:        result.attemptId,
    title:            result.title,
    durationMinutes:  result.durationMinutes,
    remainingSeconds: result.remainingSeconds,
    attemptEndAt:     result.attemptEndAt.toISOString(),
    questions:        result.questions.map(toExamContentQuestionDto),
  }
}

// ─── API 3: Save Answer ───────────────────────────────────────────────────────

export function toSaveAnswerResponseDto(
  questionId:     string,
  remainingSeconds: number,
): SaveAnswerResponseDto {
  return {
    questionId,
    remainingSeconds,
  }
}

// ─── API 4: Submit Exam ───────────────────────────────────────────────────────

export function toSubmitExamResponseDto(result: SubmitExamResult): SubmitExamResponseDto {
  return {
    attemptId:   result.attemptId,
    submittedAt: result.submittedAt.toISOString(),
  }
}

// ─── API 5: Get Attempt Status ────────────────────────────────────────────────

export function toGetAttemptStatusResponseDto(result: AttemptStatusResult): GetAttemptStatusResponseDto {
  return {
    attemptId:          result.attemptId,
    status:             result.status,
    startedAt:          result.startedAt.toISOString(),
    attemptEndAt:       result.attemptEndAt.toISOString(),
    submittedAt:        result.submittedAt ? result.submittedAt.toISOString() : null,
    endedBy:            result.endedBy,
    remainingSeconds:   result.remainingSeconds,
    lastSavedAt:        result.lastSavedAt ? result.lastSavedAt.toISOString() : null,
    isOnline:           result.isOnline,
    answeredCount:      result.answeredCount,
    totalQuestionCount: result.totalQuestionCount,
  }
}
