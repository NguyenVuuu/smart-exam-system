import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { ApiFieldErrors } from '../../../../api/errors'
import {
  StepConfig,
  StepInfo,
  StepPreview,
  StepQuestions,
  StepSections,
} from './ExamEditorSteps'
import { WIZARD_STEPS, type WizardStepId } from '../../constants/ExamEditorConfig'
import type {
  ExamCategory,
  ExamQuestionItem,
  ExamSection,
  ExamType,
} from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'

type SectionStat = ExamSection & {
  questionCount: number
  points: number
}

interface ExamEditorStepContentProps {
  activeStep: WizardStepId
  setActiveStep: Dispatch<SetStateAction<WizardStepId>>
  // StepInfo props
  title: string
  setTitle: (value: string) => void
  description: string
  setDescription: (value: string) => void
  examCategory: ExamCategory
  setExamCategory: (value: ExamCategory) => void
  examType: ExamType
  updateExamType: (value: ExamType) => void
  selectedSubjectId: string
  setSubjectId: (value: string) => void
  subjectOptions: Array<{ value: string; label: string }>
  selectedSemesterId: string
  setSemesterId: (value: string) => void
  semesterOptions: Array<{ value: string; label: string }>
  // StepSections props
  sections: ExamSection[]
  setSections: Dispatch<SetStateAction<ExamSection[]>>
  activeSectionId: string
  setActiveSectionId: Dispatch<SetStateAction<string>>
  // StepQuestions props
  sectionStats: SectionStat[]
  visibleQuestions: ExamQuestionItem[]
  revisionNotes: Map<string, string>
  questions: ExamQuestionItem[]
  setQuestions: Dispatch<SetStateAction<ExamQuestionItem[]>>
  collapsedQuestionIds: string[]
  onToggleQuestionCollapse: (questionId: string) => void
  onOpenBankPicker: () => void
  onOpenManualEditor: () => void
  onOpenAiPdf: () => void
  onEditQuestion: (question: Question) => void
  // StepConfig props
  durationMinutes: number | ''
  setDurationMinutes: (value: number | '') => void
  targetTotalPoints: number
  onUpdateTargetTotalPoints: (value: number) => void
  // Validation
  fieldErrors: ApiFieldErrors
  onFieldChange: (field: string) => void
}

export default function ExamEditorStepContent({
  activeStep,
  setActiveStep,
  title,
  setTitle,
  description,
  setDescription,
  examCategory,
  setExamCategory,
  examType,
  updateExamType,
  selectedSubjectId,
  setSubjectId,
  subjectOptions,
  selectedSemesterId,
  setSemesterId,
  semesterOptions,
  sections,
  setSections,
  activeSectionId,
  setActiveSectionId,
  sectionStats,
  visibleQuestions,
  revisionNotes,
  questions,
  setQuestions,
  collapsedQuestionIds,
  onToggleQuestionCollapse,
  onOpenBankPicker,
  onOpenManualEditor,
  onOpenAiPdf,
  onEditQuestion,
  durationMinutes,
  setDurationMinutes,
  targetTotalPoints,
  onUpdateTargetTotalPoints,
  fieldErrors,
  onFieldChange,
}: ExamEditorStepContentProps) {
  const stepIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStep)

  return (
    <>
      {activeStep === 'INFO' && (
        <StepInfo
          title={title}
          setTitle={setTitle}
          description={description}
          setDescription={setDescription}
          examCategory={examCategory}
          setExamCategory={setExamCategory}
          examType={examType}
          updateExamType={updateExamType}
          subjectId={selectedSubjectId}
          setSubjectId={setSubjectId}
          subjectOptions={subjectOptions}
          semesterId={selectedSemesterId}
          setSemesterId={setSemesterId}
          semesterOptions={semesterOptions}
          fieldErrors={fieldErrors}
          onFieldChange={onFieldChange}
        />
      )}

      {activeStep === 'SECTIONS' && (
        <StepSections
          examType={examType}
          sections={sections}
          setSections={setSections}
          activeSectionId={activeSectionId}
          setActiveSectionId={setActiveSectionId}
          questions={questions}
          setQuestions={setQuestions}
          fieldErrors={fieldErrors}
          onFieldChange={onFieldChange}
        />
      )}

      {activeStep === 'QUESTIONS' && (
        <StepQuestions
          sections={sections}
          sectionStats={sectionStats}
          activeSectionId={activeSectionId}
          setActiveSectionId={setActiveSectionId}
          visibleQuestions={visibleQuestions}
          revisionNotes={revisionNotes}
          questions={questions}
          setQuestions={setQuestions}
          collapsedQuestionIds={collapsedQuestionIds}
          onToggleQuestionCollapse={onToggleQuestionCollapse}
          openBank={onOpenBankPicker}
          openManual={onOpenManualEditor}
          openAi={onOpenAiPdf}
          examType={examType}
          onEdit={onEditQuestion}
          fieldErrors={fieldErrors}
          onFieldChange={onFieldChange}
        />
      )}

      {activeStep === 'CONFIG' && (
        <StepConfig
          durationMinutes={durationMinutes}
          setDurationMinutes={setDurationMinutes}
          targetTotalPoints={targetTotalPoints}
          setTargetTotalPoints={onUpdateTargetTotalPoints}
          fieldErrors={fieldErrors}
          onFieldChange={onFieldChange}
        />
      )}

      {activeStep === 'PREVIEW' && (
        <StepPreview
          examType={examType}
          title={title}
          description={description}
          sectionStats={sectionStats}
          questions={questions}
        />
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={stepIndex === 0}
          onClick={() => setActiveStep(WIZARD_STEPS[Math.max(stepIndex - 1, 0)].id)}
          className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 disabled:text-gray-300"
        >
          <ChevronLeft size={15} /> Bước trước
        </button>

        <button
          type="button"
          disabled={stepIndex === WIZARD_STEPS.length - 1}
          onClick={() => setActiveStep(WIZARD_STEPS[Math.min(stepIndex + 1, WIZARD_STEPS.length - 1)].id)}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400"
        >
          Bước tiếp theo <ChevronRight size={15} />
        </button>
      </div>
    </>
  )
}
