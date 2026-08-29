import type { ExamDistributionMode, ExamLocationMode, ResultReleaseMode, ReviewPolicy } from '@prisma/client'

export interface ScheduleCourseInput {
  courseOfferingId: string
  teacherIds: string[]
}

export interface ScheduleWriteInput {
  title: string; examId: string; startTime: Date; endTime: Date
  durationMinutes: number; maxAttempts: number; passwordHash?: string | null
  enableTabLock: boolean; maxTabSwitches: number | null; requireFullscreen: boolean
  enableWebcam: boolean; blockCopyPaste: boolean; blockRightClick: boolean
  locationMode: ExamLocationMode; allowedIpRanges: string[]
  distributionMode: ExamDistributionMode; randomQuestionCount: number | null
  resultReleaseMode: ResultReleaseMode; resultReleaseAt: Date | null
  reviewPolicy: ReviewPolicy; reviewStartAt: Date | null; reviewEndAt: Date | null
  status: 'DRAFT' | 'SCHEDULED'; courses: ScheduleCourseInput[]
}
