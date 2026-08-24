import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { TeacherTwoColumnLayout, TeacherTwoColumnMain } from './components/TeacherTwoColumnLayout'
import AIPdfGeneratorModal from './components/exam-detail/AIPdfGeneratorModal'
import BankQuestionPickerModal from './components/exam-detail/BankQuestionPickerModal'
import {
  ExamSummary,
  StepConfig,
  StepInfo,
  StepPreview,
  StepQuestions,
  StepSections,
} from './components/exam-editor/ExamEditorSteps'
import { WIZARD_STEPS, examTypeLabel, type WizardStepId } from './constants/ExamEditorConfig'
import {
  balanceQuestionPointsBySection,
  buildInitialSections,
  getDefaultTitle,
  inferSectionId,
  isQuestionAllowedForExam,
  splitPointsPrecisely,
} from './utils/ExamEditorUtils'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import { MOCK_TEACHER_COURSES } from './mock/teacher-course.mock'
import { MOCK_QUESTION_BANK } from './mock/teacher-question-bank.mock'
import type {
  Exam,
  ExamCategory,
  ExamQuestionItem,
  ExamSection,
  ExamType,
} from './types/teacher-exam.types'
import type { Question } from './types/teacher-question-bank.types'
import { useTeacherWorkspaceStore } from './store/teacherWorkspaceStore'
import { useAuthStore } from '../../store/authStore'

export default function TeacherExamEditorPage() {
  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const exams = useTeacherWorkspaceStore((state) => state.exams)
  const upsertExam = useTeacherWorkspaceStore((state) => state.upsertExam)
  const currentUser = useAuthStore((state) => state.user)
  const copyFromId = searchParams.get('copyFrom')
  const isCopy = Boolean(copyFromId)
  const sourceExam = exams.find((item) => item.id === (copyFromId || examId))
  const initialTypeFromUrl = sourceExam?.type || (searchParams.get('type') as ExamType) || 'MULTIPLE_CHOICE'
  const initialSections = sourceExam?.sections?.map((section) => ({ ...section })) || buildInitialSections(initialTypeFromUrl)

  const [activeStep, setActiveStep] = useState<WizardStepId>('INFO')
  const [title, setTitle] = useState(
    sourceExam ? `${isCopy ? 'Bản sao - ' : ''}${sourceExam.title}` : getDefaultTitle(initialTypeFromUrl),
  )
  const [description, setDescription] = useState(
    sourceExam?.description || 'Kiểm tra kiến thức theo nội dung lớp học phần.',
  )
  const [examCategory, setExamCategory] = useState<ExamCategory>(sourceExam?.category || 'QUIZ')
  const [examType, setExamType] = useState<ExamType>(initialTypeFromUrl)
  const [subjectId, setSubjectId] = useState(sourceExam?.subjectName || MOCK_TEACHER_COURSES[0].subjectName)
  const [sections, setSections] = useState<ExamSection[]>(initialSections)
  const [activeSectionId, setActiveSectionId] = useState(initialSections[0].id)
  const [durationMinutes, setDurationMinutes] = useState(sourceExam?.defaultDurationMinutes || 60)
  const [targetTotalPoints, setTargetTotalPoints] = useState(sourceExam?.totalPoints || 10)

  const [questions, setQuestions] = useState<ExamQuestionItem[]>(() => {
    if (sourceExam) {
      return sourceExam.questions.map((item) => ({
        ...item,
        question: { ...item.question },
      }))
    }

    const initialQuestions = MOCK_QUESTION_BANK.filter((q) => isQuestionAllowedForExam(q, initialTypeFromUrl)).map((q, i) => ({
      questionId: q.id,
      question: q,
      points: 0,
      order: i + 1,
      sectionId: inferSectionId(q, initialSections),
    }))

    return balanceQuestionPointsBySection(initialQuestions, initialSections)
  })
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<string[]>([])

  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false)
  const [isAiPdfOpen, setIsAiPdfOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  const selectedCourse =
    MOCK_TEACHER_COURSES.find((course) => course.subjectName === subjectId) || MOCK_TEACHER_COURSES[0]
  const selectedSubject = {
    subjectCode: selectedCourse.subjectCode,
    subjectName: selectedCourse.subjectName,
  }
  const totalPoints = questions.reduce((sum, item) => sum + item.points, 0)
  const stepIndex = WIZARD_STEPS.findIndex((step) => step.id === activeStep)
  const visibleQuestions = questions.filter((item) => item.sectionId === activeSectionId)

  const sectionStats = useMemo(
    () =>
      sections.map((section) => {
        const sectionQuestions = questions.filter((item) => item.sectionId === section.id)
        return {
          ...section,
          questionCount: sectionQuestions.length,
          points: sectionQuestions.reduce((sum, item) => sum + item.points, 0),
        }
      }),
    [questions, sections],
  )

  const updateTargetTotalPoints = (points: number) => {
    setTargetTotalPoints(points)
    const sectionPointList = splitPointsPrecisely(points, sections.length)
    const nextSections = sections.map((section, index) => ({
      ...section,
      targetPoints: sectionPointList[index],
    }))
    setSections(nextSections)
    setQuestions((prev) => balanceQuestionPointsBySection(prev, nextSections))
  }

  const updateExamType = (nextType: ExamType) => {
    const nextSections = buildInitialSections(nextType)
    setSearchParams(
      (prev) => {
        const nextParams = new URLSearchParams(prev)
        nextParams.set('type', nextType)
        return nextParams
      },
      { replace: true },
    )
    setExamType(nextType)
    setTitle(getDefaultTitle(nextType))
    setSections(nextSections)
    setActiveSectionId(nextSections[0].id)
    setQuestions((prev) => {
      const nextQuestions = prev
        .filter((item) => isQuestionAllowedForExam(item.question, nextType))
        .map((item, idx) => ({
          ...item,
          order: idx + 1,
          sectionId: inferSectionId(item.question, nextSections),
        }))

      return balanceQuestionPointsBySection(nextQuestions, nextSections)
    })
  }

  const addQuestions = (selectedList: Question[]) => {
    const allowedQuestions = selectedList.filter((q) => isQuestionAllowedForExam(q, examType))
    setQuestions((prev) => {
      const newItems: ExamQuestionItem[] = allowedQuestions.map((q, idx) => ({
        questionId: q.id,
        question: q,
        points: 0,
        order: prev.length + idx + 1,
        sectionId: inferSectionId(q, sections),
      }))

      return balanceQuestionPointsBySection([...prev, ...newItems], sections)
    })
  }

  const toggleQuestionCollapse = (questionId: string) => {
    setCollapsedQuestionIds((prev) =>
      prev.includes(questionId) ? prev.filter((id) => id !== questionId) : [...prev, questionId],
    )
  }

  const handleSaveQuestion = (savedQ: Partial<Question>) => {
    if (editingQuestion) {
      setQuestions((prev) => {
        const nextQuestions = prev.map((item) =>
          item.questionId === editingQuestion.id
            ? {
                ...item,
                question: { ...item.question, ...savedQ } as Question,
                sectionId: inferSectionId({ ...item.question, ...savedQ } as Question, sections),
              }
            : item,
        )

        return balanceQuestionPointsBySection(nextQuestions, sections)
      })
      setEditingQuestion(null)
      return
    }

    const newQuestion: Question = {
      id: `q-manual-${Date.now()}`,
      subjectId: savedQ.subjectId || 'sub-01',
      subjectName: savedQ.subjectName || 'Lập trình Java căn bản',
      teacherId: 'gv-01',
      teacherName: 'TS. Nguyễn Văn Giảng',
      bankScope: 'PERSONAL',
      reviewStatus: 'PRIVATE',
      type: savedQ.type || (examType === 'PROGRAMMING' ? 'PROGRAMMING' : 'SINGLE_CHOICE'),
      difficulty: savedQ.difficulty || 'EASY',
      content: savedQ.content || '',
      explanation: savedQ.explanation,
      options: savedQ.options,
      programmingLanguage: savedQ.programmingLanguage,
      timeLimitMs: savedQ.timeLimitMs,
      memoryLimitMb: savedQ.memoryLimitMb,
      testCases: savedQ.testCases,
      createdAt: 'Vừa xong',
    }
    addQuestions([newQuestion])
  }

  const handleAutoBalancePoints = () => {
    if (questions.length === 0) return
    setQuestions((prev) => balanceQuestionPointsBySection(prev, sections))
  }

  const validateExam = () => {
    if (!title.trim()) {
      alert('Vui lòng nhập tên bài thi.')
      setActiveStep('INFO')
      return false
    }
    if (questions.length === 0) {
      alert('Bài thi cần có ít nhất một câu hỏi.')
      setActiveStep('QUESTIONS')
      return false
    }
    if (Math.abs(totalPoints - targetTotalPoints) >= 0.01) {
      alert(`Tổng điểm hiện tại là ${totalPoints.toFixed(2)}, phải bằng tổng điểm mục tiêu ${targetTotalPoints.toFixed(2)}.`)
      setActiveStep('QUESTIONS')
      return false
    }
    return true
  }

  const buildExam = (status: Exam['status']): Exam => ({
    id: !isCopy && sourceExam ? sourceExam.id : `exam-${Date.now()}`,
    authorId: !isCopy && sourceExam ? sourceExam.authorId : currentUser?.profileId ?? 'gv-01',
    subjectId: sourceExam?.subjectId ?? MOCK_QUESTION_BANK.find((question) => question.subjectName === selectedSubject.subjectName)?.subjectId ?? selectedSubject.subjectCode,
    subjectCode: sourceExam?.subjectCode ?? selectedSubject.subjectCode,
    subjectName: selectedSubject.subjectName,
    title: title.trim(),
    description: description.trim(),
    category: examCategory,
    type: examType,
    creationMethod: sourceExam?.creationMethod ?? 'MANUAL',
    status,
    studentVisibility: status === 'PUBLISHED' ? sourceExam?.studentVisibility ?? 'VISIBLE' : 'HIDDEN',
    defaultDurationMinutes: durationMinutes,
    sections,
    schedules: !isCopy ? sourceExam?.schedules ?? [] : [],
    questions,
    totalPoints: targetTotalPoints,
    createdAt: sourceExam?.createdAt ?? new Date().toISOString(),
  })

  const handleSaveDraft = () => {
    if (!validateExam()) return
    upsertExam(buildExam('DRAFT'))
    toast.success(`Đã lưu nháp ${examTypeLabel[examType]} với ${questions.length} câu hỏi.`)
    navigate('/teacher/exams')
  }

  const handlePublishExam = () => {
    if (!validateExam()) return
    if (examCategory === 'FINAL') {
      upsertExam(buildExam('PENDING_APPROVAL'))
      toast.success('Đã gửi đề thi cuối kỳ cho Trưởng bộ môn duyệt chuyên môn.')
    } else {
      upsertExam(buildExam('PUBLISHED'))
      toast.success('Đã hoàn tất đề thi. Bạn có thể tạo ca thi trong trang chi tiết đề.')
    }
    navigate('/teacher/exams')
  }

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans">
      <TeacherSidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <TeacherTopBar />

        <main className="flex-1 overflow-y-auto px-8 py-6 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => navigate('/teacher/exams')}
              className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Quay lại danh sách đề thi</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Save size={15} /> Lưu nháp (Draft)
              </button>
              <button
                type="button"
                onClick={handlePublishExam}
                className={`px-5 py-2 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 ${
                  examCategory === 'FINAL'
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <CheckCircle2 size={15} />
                {examCategory === 'FINAL' ? 'Gửi duyệt đề thi' : 'Tạo & Công bố đề'}
              </button>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
              {WIZARD_STEPS.map((step, index) => {
                const isActive = step.id === activeStep
                const isDone = index < stepIndex

                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => setActiveStep(step.id)}
                    className={`h-12 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors ${
                      isActive
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : isDone
                        ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                        : 'border-gray-100 bg-gray-50 text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {isDone ? <Check size={15} /> : step.icon}
                    <span>{step.title}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <TeacherTwoColumnLayout>
            <TeacherTwoColumnMain>
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
                  subjectId={subjectId}
                  setSubjectId={setSubjectId}
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
                />
              )}

              {activeStep === 'QUESTIONS' && (
                <StepQuestions
                  sections={sections}
                  sectionStats={sectionStats}
                  activeSectionId={activeSectionId}
                  setActiveSectionId={setActiveSectionId}
                  visibleQuestions={visibleQuestions}
                  questions={questions}
                  setQuestions={setQuestions}
                  collapsedQuestionIds={collapsedQuestionIds}
                  onToggleQuestionCollapse={toggleQuestionCollapse}
                  openBank={() => setIsBankPickerOpen(true)}
                  openManual={() => setIsEditorOpen(true)}
                  openAi={() => setIsAiPdfOpen(true)}
                  examType={examType}
                  onEdit={(question) => {
                    setEditingQuestion(question)
                    setIsEditorOpen(true)
                  }}
                />
              )}

              {activeStep === 'CONFIG' && (
                <StepConfig
                  durationMinutes={durationMinutes}
                  setDurationMinutes={setDurationMinutes}
                  targetTotalPoints={targetTotalPoints}
                  setTargetTotalPoints={updateTargetTotalPoints}
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
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-700 disabled:text-gray-300 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  <ChevronLeft size={15} /> Bước trước
                </button>

                <button
                  type="button"
                  disabled={stepIndex === WIZARD_STEPS.length - 1}
                  onClick={() => setActiveStep(WIZARD_STEPS[Math.min(stepIndex + 1, WIZARD_STEPS.length - 1)].id)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-200 text-white disabled:text-gray-400 font-semibold text-xs rounded-xl flex items-center gap-1.5"
                >
                  Bước tiếp theo <ChevronRight size={15} />
                </button>
              </div>
            </TeacherTwoColumnMain>

            <ExamSummary
              examType={examType}
              title={title}
              selectedSubject={selectedSubject}
              sections={sections}
              sectionStats={sectionStats}
              questions={questions}
              totalPoints={totalPoints}
              onAutoBalancePoints={handleAutoBalancePoints}
            />
          </TeacherTwoColumnLayout>
        </main>
      </div>

      <BankQuestionPickerModal
        isOpen={isBankPickerOpen}
        onClose={() => setIsBankPickerOpen(false)}
        onSelectQuestions={addQuestions}
        existingQuestionIds={questions.map((q) => q.questionId)}
        examType={examType}
      />

      <AIPdfGeneratorModal
        isOpen={isAiPdfOpen}
        onClose={() => setIsAiPdfOpen(false)}
        onApprovedAdd={addQuestions}
        examType={examType}
      />

      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        examType={examType}
      />
    </div>
  )
}
