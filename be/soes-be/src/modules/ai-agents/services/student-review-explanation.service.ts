import { ForbiddenError } from '../../../errors/AppError'
import prisma from '../../../lib/prisma'
import { writeAuditLog } from '../../audit-logs/audit-log.writer'
import { getAttemptResult } from '../../student-take-exam/services/student-take-exam.service'
import type { AttemptReviewItem } from '../../student-take-exam/types'
import { requestInsightAgent } from './ai-agent.client'
import { getReviewableQuestion } from './review-question.policy'

export function reviewQuestionSource(item: AttemptReviewItem): string {
  const lines = [`Đề bài: ${item.content}`, `Điểm: ${item.score ?? 0}/${item.points}`]
  if (item.type === 'PROGRAMMING') {
    lines.push(`Mã đã nộp:\n${item.draftSourceCode ?? 'Không có'}`)
    lines.push('Không có kết quả test case chi tiết. Không suy đoán nguyên nhân sai chính xác.')
  } else {
    for (const option of item.options ?? []) {
      lines.push(`Lựa chọn ${option.id}: ${option.content}`)
    }
    lines.push(`Đã chọn: ${item.selectedOptionIds?.join(', ') || 'Không chọn'}`)
    lines.push(`Đáp án đúng: ${item.correctOptionIds?.join(', ') || 'Không có'}`)
  }
  if (item.explanation) lines.push(`Giải thích của giảng viên: ${item.explanation}`)
  return lines.join('\n').slice(0, 30_000)
}

export async function explainStudentReviewQuestion(
  studentId: string, userId: string, scheduleId: string,
  attemptId: string, questionId: string, message: string,
) {
  const active = await prisma.examAttempt.count({ where: { studentId, status: 'IN_PROGRESS' } })
  if (active) throw new ForbiddenError('Learning assistant is unavailable during an exam')
  const result = await getAttemptResult(scheduleId, attemptId, studentId)
  const item = getReviewableQuestion(result, questionId)
  await writeAuditLog(prisma, {
    userId, action: 'REQUEST_AI_QUESTION_EXPLANATION', entityType: 'ExamQuestion', entityId: questionId,
    metadata: { attemptId, scheduleId },
  })
  const answer = await requestInsightAgent('/v1/student/insights', {
    message,
    analyzedAttemptCount: 0, limitedToRecentAttempts: false, topics: [],
    material: {
      materialId: questionId, title: `Câu ${item.orderIndex}`, mimeType: 'text/plain',
      contentBase64: Buffer.from(reviewQuestionSource(item), 'utf8').toString('base64'),
    },
  })
  return { answer }
}
