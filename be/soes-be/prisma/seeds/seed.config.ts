import { ExamType, ExamCreationMethod } from '@prisma/client'

// ── Seed Mode ─────────────────────────────────────────────
// "demo"  → all exams CLOSED, every student has scores for QUIZ + MIDTERM + FINAL
// "real"  → QUIZ=CLOSED, MIDTERM=PUBLISHED, FINAL=DRAFT (only CLOSED get attempts)
export type SeedMode = 'demo' | 'real'

export const SEED_MODE: SeedMode = (process.env.SEED_MODE as SeedMode) ?? 'demo'

// ── Quiz count per subject code ────────────────────────────
// Controls how many QUIZ exams are generated per CourseOffering of that subject.
// Add or change entries freely — exam seed reads this map at runtime.
export const QUIZ_COUNT_BY_SUBJECT_CODE: Record<string, number> = {
  JAVA101:  4,
  SQL101:   2,
  REACT101: 3,
  AI101:    1,
  CNPM101:  3,
  CPP101:   2,
}

const DEFAULT_QUIZ_COUNT = 2

export function getQuizCount(subjectCode: string): number {
  return QUIZ_COUNT_BY_SUBJECT_CODE[subjectCode] ?? DEFAULT_QUIZ_COUNT
}

// ── Fixed exam specs (Midterm + Final) ─────────────────────

export interface FixedExamSpec {
  titleSuffix: string
  type: ExamType
  durationMinutes: number
  startOffset: number   // days from now
  endOffset: number
  realStatus: 'DRAFT' | 'PUBLISHED' | 'CLOSED'
  creationMethod: ExamCreationMethod
}

export const FIXED_EXAMS: FixedExamSpec[] = [
  {
    titleSuffix:     'Giữa kỳ',
    type:            ExamType.MIDTERM,
    durationMinutes: 60,
    startOffset:     16,
    endOffset:       17,
    realStatus:      'PUBLISHED',
    creationMethod:  'MANUAL',
  },
  {
    titleSuffix:     'Cuối kỳ',
    type:            ExamType.FINAL,
    durationMinutes: 90,
    startOffset:     60,
    endOffset:       61,
    realStatus:      'DRAFT',
    creationMethod:  'MANUAL',
  },
]

// ── Quiz timing ────────────────────────────────────────────
// Each quiz is spaced QUIZ_SPACING_DAYS apart, ending before the midterm
export const QUIZ_SPACING_DAYS = 14
export const QUIZ_BASE_OFFSET  = -90  // first quiz starts 90 days ago
