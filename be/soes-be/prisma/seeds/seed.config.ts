import { ExamCreationMethod, ExamStatus, ExamType } from '@prisma/client'

export type SeedMode = 'demo' | 'real'

export const SEED_MODE: SeedMode = (process.env.SEED_MODE as SeedMode) ?? 'demo'

export const QUIZ_COUNT_BY_SUBJECT_CODE: Record<string, number> = {
  JAVA101: 4,
  SQL101: 2,
  REACT101: 3,
  AI101: 1,
  CNPM101: 3,
  CPP101: 2,
}

export function getQuizCount(subjectCode: string): number {
  return QUIZ_COUNT_BY_SUBJECT_CODE[subjectCode] ?? 2
}

export interface FixedExamSpec {
  key: string
  titleSuffix: string
  type: ExamType
  durationMinutes: number
  status: ExamStatus
  creationMethod: ExamCreationMethod
}

export const FIXED_EXAMS: FixedExamSpec[] = [
  {
    key: 'midterm',
    titleSuffix: 'Giữa kỳ',
    type: ExamType.MIDTERM,
    durationMinutes: 60,
    status: ExamStatus.READY,
    creationMethod: ExamCreationMethod.MANUAL,
  },
  {
    key: 'final',
    titleSuffix: 'Cuối kỳ',
    type: ExamType.FINAL,
    durationMinutes: 90,
    status: ExamStatus.READY,
    creationMethod: ExamCreationMethod.MANUAL,
  },
]

export const QUIZ_SPACING_DAYS = 14
export const QUIZ_BASE_OFFSET = -90
