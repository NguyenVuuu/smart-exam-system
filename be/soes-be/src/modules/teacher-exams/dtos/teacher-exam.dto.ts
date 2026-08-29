import type { ExamCapabilities } from '../types/teacher-exam.types'

export interface TeacherExamDto {
  id: string; title: string; description: string | null; type: string; format: string
  creationMethod: string; status: string; approvalStatus: string
  defaultDurationMinutes: number; totalPoints: number
  subject: { id: string; code: string; name: string }
  creator: { id: string; fullName: string }; reviewer: { id: string; fullName: string } | null
  rejectionReason: string | null; questionCount: number; scheduleCount: number
  sections: Array<{
    id: string; title: string; description: string | null; type: string; targetPoints: number; orderIndex: number
  }>
  capabilities: ExamCapabilities; createdAt: Date; updatedAt: Date
}

export interface TeacherExamDetailDto extends TeacherExamDto {
  questions: Array<{
    id: string; sourceQuestionId: string | null; sectionId: string | null
    content: string; explanation: string | null; type: string; difficulty: string
    language: string | null; points: number; orderIndex: number
    options: Array<{ id: string; content: string; isCorrect: boolean }>
    programmingConfig: { timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number } | null
    testCases: Array<{
      id: string; input: string; expectedOutput: string; weight: number; isHidden: boolean
    }>
  }>
}
