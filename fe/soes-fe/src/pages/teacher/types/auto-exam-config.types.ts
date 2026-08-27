import type {
  AutoExamDraftStatus,
  AutoExamPickMode,
} from './teacher-auto-exam.types'
import type { ExamCategory } from './teacher-exam.types'
import type { Question } from './teacher-question-bank.types'

export interface AutoExamConfigPanelProps {
  examTitle: string
  setExamTitle: (value: string) => void
  examCategory: ExamCategory
  setExamCategory: (value: ExamCategory) => void
  durationMinutes: number
  setDurationMinutes: (value: number) => void
  targetTotalPoints: number
  setTargetTotalPoints: (value: number) => void
  selectedSubject: string
  onSubjectChange: (value: string) => void
  draftStatus: AutoExamDraftStatus
  eligibleQuestions: Question[]
  filteredEligibleQuestions: Question[]
  selectedQuestionIds: string[]
  selectedQuestions: Question[]
  pickMode: AutoExamPickMode
  setPickMode: (value: AutoExamPickMode) => void
  questionSearch: string
  setQuestionSearch: (value: string) => void
  toggleQuestionSelection: (questionId: string) => void
  easyCount: number
  setEasyCount: (value: number) => void
  mediumCount: number
  setMediumCount: (value: number) => void
  hardCount: number
  setHardCount: (value: number) => void
  isGenerating: boolean
  totalQuestions: number
  onGenerate: () => void
}
