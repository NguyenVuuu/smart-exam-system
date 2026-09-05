export interface TeacherExamCapabilities {
  canEdit: boolean
  canDelete: boolean
  canSubmitForApproval: boolean
  canSchedule: boolean
  canLock: boolean
  canUnlock: boolean
  canToggleStudentVisibility: boolean
  canCopy: boolean
  canArchive: boolean
  lockReason?: string
}

export interface TeacherExamDto {
  id: string
  title: string
  description: string | null
  type: 'QUIZ' | 'MIDTERM' | 'FINAL'
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  creationMethod: 'MANUAL' | 'QUESTION_BANK' | 'AI_GENERATED' | 'MIXED'
  status: 'DRAFT' | 'READY' | 'LOCKED' | 'ARCHIVED'
  studentVisibility: 'VISIBLE' | 'HIDDEN'
  approvalStatus: 'NOT_REQUIRED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  defaultDurationMinutes: number
  totalPoints: number
  subject: { id: string; code: string; name: string }
  semester: { id: string; code: string; name: string; status: 'UPCOMING' | 'ACTIVE' | 'CLOSED' }
  creator: { id: string; fullName: string }
  rejectionReason: string | null
  questionCount: number
  scheduleCount: number
  sections: Array<{
    id: string; title: string; description: string | null
    type: 'OBJECTIVE' | 'PROGRAMMING'; targetPoints: number; orderIndex: number
  }>
  capabilities: TeacherExamCapabilities
  createdAt: string
}

export interface TeacherExamDetailDto extends TeacherExamDto {
  questions: Array<{
    id: string
    sourceQuestionId: string | null
    sectionId: string | null
    title: string
    content: string
    explanation: string | null
    type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'PROGRAMMING'
    difficulty: 'EASY' | 'MEDIUM' | 'HARD'
    language: 'JAVA' | 'C' | 'CPP' | null
    points: number
    orderIndex: number
    options: Array<{ id: string; content: string; isCorrect: boolean }>
    programmingConfig: {
      timeLimitMs: number; memoryLimitMb: number; maxCodeSizeKb: number
    } | null
    testCases: Array<{
      id: string; input: string; expectedOutput: string; isHidden: boolean
    }>
  }>
}

export interface TeacherExamPayload {
  title: string
  description?: string | null
  subjectId: string
  semesterId: string
  type: 'QUIZ' | 'MIDTERM' | 'FINAL'
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  creationMethod: 'MANUAL' | 'QUESTION_BANK' | 'AI_GENERATED' | 'MIXED'
  defaultDurationMinutes: number
  totalPoints: number
  sections: Array<{
    id: string; title: string; description?: string | null
    type: 'OBJECTIVE' | 'PROGRAMMING'; targetPoints: number; orderIndex: number
  }>
}

export interface TeacherExamScheduleDto {
  id: string
  title: string
  startTime: string
  endTime: string
  durationMinutes: number
  maxAttempts: number
  attemptCount: number
  participantCount: number
  submissionCount: number
  status: 'DRAFT' | 'SCHEDULED' | 'OPEN' | 'CLOSED' | 'CANCELLED'
  locationMode: 'ONLINE' | 'CAMPUS'
  distributionMode: 'FIXED_ORDER' | 'SHUFFLE_QUESTIONS' | 'SHUFFLE_OPTIONS' | 'SHUFFLE_QUESTIONS_AND_OPTIONS' | 'RANDOM_SUBSET'
  randomQuestionCount: number | null
  resultReleaseMode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED' | 'NEVER'
  resultReleaseAt: string | null
  reviewPolicy: 'NONE' | 'SCORE_ONLY' | 'ANSWERS_NO_KEY' | 'FULL_AFTER_RELEASE'
  hasPassword: boolean
  requireFullscreen: boolean
  enableWebcam: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  allowedIpRanges: string[]
  courses: Array<{ id: string; code: string; proctors: Array<{ id: string; code: string; fullName: string }> }>
  exam: { id: string; title: string; type: string; subject: { id: string; code: string; name: string } }
}

export interface TeacherExamSchedulePayload {
  courseOfferingId: string
  startTime: string
  endTime: string
  durationMinutes: number
  maxAttempts: number
  password?: string | null
  requireFullscreen: boolean
  enableWebcam: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
  locationMode: 'ONLINE' | 'CAMPUS'
  allowedIpRanges: string[]
  distributionMode: TeacherExamScheduleDto['distributionMode']
  randomQuestionCount?: number | null
  resultReleaseMode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED'
  resultReleaseAt?: string | null
  allowStudentReview: boolean
}

export interface TeacherExamSubmissionDto {
  id: string; examId: string; scheduleId: string; attemptId: string; studentId: string
  studentCode: string; studentName: string; submittedAt: string | null
  autoScore: number | null; manualScoreOverride: number | null; finalScore: number | null
  status: 'SUBMITTED' | 'AUTO_SUBMITTED' | 'GRADING' | 'GRADED' | 'PUBLISHED' | 'INVALIDATED'
  sectionScores: Array<{ id: string; title: string; score: number; maxScore: number }>
  answers: Array<{
    questionId: string; selectedOptionIds: string[]; sourceCode: string | null; score: number | null
  }>
  codingResults: Array<{
    questionId: string
    testCaseId: string
    passed: boolean
    input: string
    expectedOutput: string
    actualOutput: string | null
    executionTimeMs: number
    memoryKb: number
  }>
}

export interface TeacherSubmissionPage {
  items: TeacherExamSubmissionDto[]
  pagination: { page: number; pageSize: number; totalItems: number; totalPages: number }
  resultRelease: { mode: 'IMMEDIATE' | 'MANUAL' | 'SCHEDULED'; releaseAt: string | null; published: boolean }
}
