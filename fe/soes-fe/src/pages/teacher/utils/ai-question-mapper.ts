import type { GeneratedQuestionDto } from '../types/teacher-question-api.types'
import type { AIDraftQuestion, Question } from '../types/teacher-question-bank.types'
import { formatPlainTextToHtml } from './formatHtml.utils'

export function mapGeneratedQuestion(question: GeneratedQuestionDto): Question {
  return {
    id: question.id, subjectId: question.subjectId, subjectName: question.subjectName,
    teacherId: '', teacherName: 'AI', type: question.type, difficulty: question.difficulty,
    aiDifficultyReason: question.difficultyReason, title: question.title,
    content: question.type === 'PROGRAMMING' ? formatPlainTextToHtml(question.content) : question.content,
    explanation: question.explanation,
    options: question.options.map((option, i) => ({ ...option, id: `${question.id}-option-${i}` })),
    programmingLanguage: question.language ?? undefined, timeLimitMs: question.timeLimitMs,
    memoryLimitMb: question.memoryLimitMb, maxCodeSizeKb: question.maxCodeSizeKb,
    testCases: question.testCases.map((testCase, i) => ({ ...testCase, id: `${question.id}-test-${i}` })),
    createdAt: new Date().toISOString(),
  }
}

export function toApprovedAiPayload(item: AIDraftQuestion) {
  return {
    generationId: item.generationId!, subjectId: item.subjectId,
    question: {
      title: item.type === 'PROGRAMMING' ? item.title : item.content,
      content: item.type === 'PROGRAMMING' ? formatPlainTextToHtml(item.content) : item.content,
      explanation: item.explanation ?? '', type: item.type, difficulty: item.difficulty,
      difficultyReason: item.aiDifficultyReason ?? 'Giảng viên đã rà soát mức độ khó.',
      language: item.type === 'PROGRAMMING' ? item.programmingLanguage ?? null : null,
      options: (item.options ?? []).map(({ content, isCorrect }) => ({ content, isCorrect })),
      timeLimitMs: item.timeLimitMs ?? 2000, memoryLimitMb: item.memoryLimitMb ?? 256,
      maxCodeSizeKb: item.maxCodeSizeKb ?? 256,
      testCases: (item.testCases ?? []).map(({ input, expectedOutput, isHidden }) => ({ input, expectedOutput, isHidden })),
    },
  }
}
