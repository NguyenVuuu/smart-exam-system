import AIPdfGeneratorModal from '../exam-detail/AIPdfGeneratorModal'
import BankQuestionPickerModal from '../exam-detail/BankQuestionPickerModal'
import QuestionEditorModal from '../question-bank/QuestionEditorModal'
import type { ExamType } from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'

interface ExamEditorModalsProps {
  isBankPickerOpen: boolean
  onCloseBankPicker: () => void
  onSelectBankQuestions: (selected: Question[]) => void
  existingQuestionIds: string[]
  bankQuestions: Question[]
  selectedSubjectId: string
  isAiPdfOpen: boolean
  onCloseAiPdf: () => void
  onApprovedAiQuestions: (selected: Question[]) => void
  isEditorOpen: boolean
  onCloseEditor: () => void
  onSaveQuestion: (question: Partial<Question>) => void
  editingQuestion: Question | null
  examType: ExamType
  subjects: Array<{ id: string; name: string }>
}

export default function ExamEditorModals({
  isBankPickerOpen,
  onCloseBankPicker,
  onSelectBankQuestions,
  existingQuestionIds,
  bankQuestions,
  selectedSubjectId,
  isAiPdfOpen,
  onCloseAiPdf,
  onApprovedAiQuestions,
  isEditorOpen,
  onCloseEditor,
  onSaveQuestion,
  editingQuestion,
  examType,
  subjects,
}: ExamEditorModalsProps) {
  return (
    <>
      <BankQuestionPickerModal
        isOpen={isBankPickerOpen}
        onClose={onCloseBankPicker}
        onSelectQuestions={onSelectBankQuestions}
        existingQuestionIds={existingQuestionIds}
        examType={examType}
        questions={bankQuestions}
        targetSubjectId={selectedSubjectId}
      />

      {isAiPdfOpen && (
        <AIPdfGeneratorModal
          onClose={onCloseAiPdf}
          onApprovedAdd={onApprovedAiQuestions}
          examType={examType}
          subjectId={selectedSubjectId}
        />
      )}

      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={onCloseEditor}
        onSave={onSaveQuestion}
        initialQuestion={editingQuestion}
        examType={examType}
        subjects={subjects}
      />
    </>
  )
}
