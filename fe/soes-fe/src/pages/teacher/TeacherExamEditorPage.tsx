import { useEffect } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { TeacherTwoColumnLayout, TeacherTwoColumnMain } from './components/TeacherTwoColumnLayout'
import { ExamSummary } from './components/exam-editor/ExamEditorSteps'
import { ExamEditorHeader } from './components/exam-editor/ExamEditorHeader'
import { ExamEditorWizardNav } from './components/exam-editor/ExamEditorWizardNav'
import ExamEditorStepContent from './components/exam-editor/ExamEditorStepContent'
import ExamEditorModals from './components/exam-editor/ExamEditorModals'
import type { ExamType } from './types/teacher-exam.types'
import { useTeacherCourses } from './hooks/useTeacherCourses'
import { useTeacherExamDetail } from './hooks/useTeacherExamDetail'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import { useTeacherExamEditorForm } from './hooks/useTeacherExamEditorForm'

export default function TeacherExamEditorPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const [searchParams] = useSearchParams()
  const openQuestions = searchParams.get('step') === 'QUESTIONS'
  const { courses, semesterOptions, currentSemesterId } = useTeacherCourses()
  const { questions: bankQuestions, subjects } = useTeacherQuestions()
  const copyFromId = searchParams.get('copyFrom')
  const isCopy = Boolean(copyFromId)
  const sourceId = copyFromId || examId
  const { exam: sourceExam, loading: sourceLoading, error: sourceError } = useTeacherExamDetail(sourceId)
  const initialTypeFromUrl = (searchParams.get('type') as ExamType) || 'MULTIPLE_CHOICE'

  const form = useTeacherExamEditorForm({
    sourceExam,
    isCopy,
    openQuestions,
    initialTypeFromUrl,
    courses,
    currentSemesterId,
  })

  useEffect(() => {
    if (!sourceId || sourceLoading || !sourceError) return
    toast.error(sourceError)
    navigate('/teacher/exams', { replace: true })
  }, [navigate, sourceError, sourceId, sourceLoading])

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <ExamEditorHeader
            onBack={() => navigate('/teacher/exams')}
            onSaveDraft={form.handleSaveDraft}
            onPublishExam={form.handlePublishExam}
            examCategory={form.examCategory}
          />

          <ExamEditorWizardNav
            activeStep={form.activeStep}
            setActiveStep={form.setActiveStep}
          />

          <TeacherTwoColumnLayout>
            <TeacherTwoColumnMain>
              <ExamEditorStepContent
                activeStep={form.activeStep}
                setActiveStep={form.setActiveStep}
                title={form.title}
                setTitle={form.setTitle}
                description={form.description}
                setDescription={form.setDescription}
                examCategory={form.examCategory}
                setExamCategory={form.setExamCategory}
                examType={form.examType}
                updateExamType={form.updateExamType}
                selectedSubjectId={form.selectedSubjectId}
                setSubjectId={form.setSubjectId}
                subjectOptions={form.subjectOptions}
                selectedSemesterId={form.selectedSemesterId}
                setSemesterId={form.setSemesterId}
                semesterOptions={semesterOptions}
                sections={form.sections}
                setSections={form.setSections}
                activeSectionId={form.activeSectionId}
                setActiveSectionId={form.setActiveSectionId}
                sectionStats={form.sectionStats}
                visibleQuestions={form.visibleQuestions}
                revisionNotes={form.revisionNotes}
                questions={form.questions}
                setQuestions={form.setQuestions}
                collapsedQuestionIds={form.collapsedQuestionIds}
                onToggleQuestionCollapse={form.toggleQuestionCollapse}
                onOpenBankPicker={() => form.setIsBankPickerOpen(true)}
                onOpenManualEditor={() => form.setIsEditorOpen(true)}
                onOpenAiPdf={() => form.setIsAiPdfOpen(true)}
                onEditQuestion={(question) => {
                  form.setEditingQuestion(question)
                  form.setIsEditorOpen(true)
                }}
                durationMinutes={form.durationMinutes}
                setDurationMinutes={form.setDurationMinutes}
                targetTotalPoints={form.targetTotalPoints}
                onUpdateTargetTotalPoints={form.updateTargetTotalPoints}
                fieldErrors={form.fieldErrors}
                onFieldChange={form.clearFieldError}
              />
            </TeacherTwoColumnMain>

            <ExamSummary
              examType={form.examType}
              title={form.title}
              selectedSubject={form.selectedSubject}
              sections={form.sections}
              sectionStats={form.sectionStats}
              questions={form.questions}
              totalPoints={form.totalPoints}
              targetTotalPoints={form.targetTotalPoints}
              onAutoBalancePoints={form.handleAutoBalancePoints}
            />
          </TeacherTwoColumnLayout>
        </main>
      </div>

      <ExamEditorModals
        isBankPickerOpen={form.isBankPickerOpen}
        onCloseBankPicker={() => form.setIsBankPickerOpen(false)}
        onSelectBankQuestions={(selected) => form.addQuestions(selected, 'QUESTION_BANK')}
        existingQuestionIds={form.questions.map((q) => q.questionId)}
        bankQuestions={bankQuestions}
        selectedSubjectId={form.selectedSubjectId}
        isAiPdfOpen={form.isAiPdfOpen}
        onCloseAiPdf={() => form.setIsAiPdfOpen(false)}
        onApprovedAiQuestions={(selected) => form.addQuestions(selected, 'INLINE')}
        isEditorOpen={form.isEditorOpen}
        onCloseEditor={() => {
          form.setIsEditorOpen(false)
          form.setEditingQuestion(null)
        }}
        onSaveQuestion={form.handleSaveQuestion}
        editingQuestion={form.editingQuestion}
        examType={form.examType}
        subjects={subjects}
      />
    </div>
  )
}
