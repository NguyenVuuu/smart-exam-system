import { toExamDetail } from './teacher-exam.mapper'
import type { ExamApprovalDetailDto } from '../api/teacher-approvals.api'
import type { TeacherExamDetailDto } from '../types/teacher-exam-api.types'

export function toReviewExam(detail: ExamApprovalDetailDto) {
  const snapshot = detail.snapshot
  const dto: TeacherExamDetailDto = {
    ...detail,
    title: snapshot.title,
    description: snapshot.description,
    defaultDurationMinutes: snapshot.defaultDurationMinutes,
    totalPoints: Number(snapshot.totalPoints),
    sections: snapshot.sections.map((section) => ({ ...section, targetPoints: Number(section.targetPoints) })),
    questions: snapshot.examQuestions.map((question) => ({
      id: question.id, sourceQuestionId: question.sourceQuestionId, sectionId: question.sectionId,
      title: question.title, content: question.content, explanation: question.explanation,
      type: question.type, difficulty: question.difficulty, language: question.language,
      points: Number(question.points), orderIndex: question.orderIndex,
      options: question.options,
      programmingConfig: question.programmingConfig ? {
        timeLimitMs: question.programmingConfig.timeLimitMs,
        memoryLimitMb: Math.round(question.programmingConfig.memoryLimitKb / 1024),
        maxCodeSizeKb: question.programmingConfig.maxCodeSizeKb,
      } : null,
      testCases: question.programmingTests,
    })),
  }
  return toExamDetail(dto)
}
