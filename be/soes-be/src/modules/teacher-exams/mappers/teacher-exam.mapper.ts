import type { Prisma } from '@prisma/client'
import type { TeacherExamDetailDto, TeacherExamDto } from '../dtos/teacher-exam.dto'
import type { examDetailInclude, examInclude } from '../repositories/teacher-exams.repository'
import type { ExamCapabilities } from '../types/teacher-exam.types'

type ExamRow = Prisma.ExamGetPayload<{ include: typeof examInclude }>
type ExamDetailRow = Prisma.ExamGetPayload<{ include: typeof examDetailInclude }>

export function examCapabilities(row: ExamRow, ownerId: string): ExamCapabilities {
  const owns = row.createdById === ownerId
  const editable = owns && row.status === 'DRAFT' && row.approvalStatus !== 'PENDING'
  return {
    canEdit: editable, canDelete: editable && row._count.schedules === 0,
    canSubmitForApproval: owns && row.status === 'DRAFT' && row._count.examQuestions > 0,
    canSchedule: row.status === 'READY', canCopy: owns, canArchive: owns && row.status !== 'DRAFT',
    ...(!editable && { lockReason: 'Exam is not editable in its current state' }),
  }
}

export function toTeacherExamDto(row: ExamRow, actorId: string): TeacherExamDto {
  return {
    id: row.id, title: row.title, description: row.description, type: row.type, format: row.format,
    creationMethod: row.creationMethod, status: row.status, approvalStatus: row.approvalStatus,
    defaultDurationMinutes: row.defaultDurationMinutes, totalPoints: Number(row.totalPoints),
    subject: { id: row.subject.id, code: row.subject.code, name: row.subject.name },
    creator: { id: row.createdBy.id, fullName: row.createdBy.user.fullName },
    reviewer: row.reviewedBy ? { id: row.reviewedBy.id, fullName: row.reviewedBy.user.fullName } : null,
    rejectionReason: row.rejectionReason, questionCount: row._count.examQuestions,
    scheduleCount: row._count.schedules, capabilities: examCapabilities(row, actorId),
    sections: row.sections.map((section) => ({
      id: section.id, title: section.title, description: section.description,
      type: section.type, targetPoints: Number(section.targetPoints), orderIndex: section.orderIndex,
    })),
    createdAt: row.createdAt, updatedAt: row.updatedAt,
  }
}

export function toTeacherExamDetailDto(row: ExamDetailRow, actorId: string): TeacherExamDetailDto {
  return {
    ...toTeacherExamDto(row, actorId),
    questions: row.examQuestions.map((question) => ({
      id: question.id, sourceQuestionId: question.sourceQuestionId, sectionId: question.sectionId,
      content: question.content, explanation: question.explanation, type: question.type,
      difficulty: question.difficulty, language: question.language,
      points: Number(question.points), orderIndex: question.orderIndex,
      options: question.options.map(({ id, content, isCorrect }) => ({ id, content, isCorrect })),
      programmingConfig: question.programmingConfig ? {
        timeLimitMs: question.programmingConfig.timeLimitMs,
        memoryLimitMb: Math.round(question.programmingConfig.memoryLimitKb / 1024),
        maxCodeSizeKb: question.programmingConfig.maxCodeSizeKb,
      } : null,
      testCases: question.programmingTests.map((test) => ({
        id: test.id, input: test.input, expectedOutput: test.expectedOutput,
        weight: Number(test.weight), isHidden: test.isHidden,
      })),
    })),
  }
}
