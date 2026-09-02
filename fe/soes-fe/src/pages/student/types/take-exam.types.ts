export type TakeExamQuestionType = 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'CODING'
export type TakeExamLanguage = 'C' | 'CPP' | 'JAVA'
export type TakeExamPhase = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED'
export type DraftSaveState = 'IDLE' | 'SAVING' | 'SAVED'
export type QuestionAnswer = string | string[]

export interface TakeExamChoiceOption {
  id: string
  content: string
}

export interface TakeExamQuestion {
  id: string
  orderIndex: number
  type: TakeExamQuestionType
  content: string
  points: number
  options?: TakeExamChoiceOption[]
  language?: TakeExamLanguage
  starterCode?: string
  programmingConfig?: {
    timeLimitMs: number
    memoryLimitMb: number
    maxCodeSizeKb: number
  }
  answer?: QuestionAnswer
}

export interface TakeExamSession {
  attemptId: string
  title: string
  durationMinutes: number
  remainingSeconds: number
  deadlineAt: string
  integritySettings: TakeExamIntegritySettings
  questions: TakeExamQuestion[]
}

export interface TakeExamIntegritySettings {
  enableWebcam: boolean
  requireFullscreen: boolean
  blockCopyPaste: boolean
  blockRightClick: boolean
}

export type TakeExamAnswers = Record<string, QuestionAnswer | undefined>

export interface TakeExamPageProps {
  initialSession?: TakeExamSession
}

export interface TakeExamState {
  currentQuestionIndex: number
  secondsRemaining: number
  flaggedQuestionIds: string[]
  phase: TakeExamPhase
  saveState: DraftSaveState
}
