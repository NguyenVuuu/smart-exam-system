import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Save,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
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
  orderQuestionsBySection,
} from './utils/ExamEditorUtils'
import QuestionEditorModal from './components/question-bank/QuestionEditorModal'
import type {
  ExamCategory,
  ExamQuestionItem,
  ExamSection,
  ExamType,
} from './types/teacher-exam.types'
import type { Question } from './types/teacher-question-bank.types'
import { useTeacherCourses } from './hooks/useTeacherCourses'
import { useTeacherExamDetail } from './hooks/useTeacherExamDetail'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import { useAuthStore } from '../../store/authStore'
import * as examApi from './api/teacher-exams.api'
import type { TeacherExamQuestionInput } from './api/teacher-exams.api'

const toExamQuestionInput = (item: ExamQuestionItem): TeacherExamQuestionInput => {
  const placement = { points: item.points, sectionId: item.sectionId }
  if (item.sourceQuestionId) {
    return { ...placement, source: 'QUESTION_BANK', questionId: item.sourceQuestionId }
  }

  const question = item.question
  return {
    ...placement,
    source: 'INLINE',
    question: {
      title: question.title,
      content: question.content || question.title,
      explanation: question.explanation ?? null,
      type: question.type,
      difficulty: question.difficulty,
      language: question.programmingLanguage ?? null,
      options: (question.options ?? []).map(({ content, isCorrect }) => ({ content, isCorrect })),
      programmingConfig: question.type === 'PROGRAMMING'
        ? {
            timeLimitMs: question.timeLimitMs ?? 2000,
            memoryLimitMb: question.memoryLimitMb ?? 256,
            maxCodeSizeKb: question.maxCodeSizeKb ?? 256,
          }
        : null,
      testCases: (question.testCases ?? []).map(({ input, expectedOutput, isHidden }) => ({
        input,
        expectedOutput,
        isHidden,
      })),
    },
  }
}

export default function TeacherExamEditorPage() {
  const user = useAuthStore((state) => state.user)
  const isDepartmentHead =
    user?.position === 'DEPARTMENT_HEAD' ||
    Boolean(user?.permissions?.includes('APPROVE_FINAL_EXAM'))

  const navigate = useNavigate()
  const { examId } = useParams<{ examId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { courses, semesterOptions, currentSemesterId } = useTeacherCourses()
  const { questions: bankQuestions, subjects } = useTeacherQuestions()
  const copyFromId = searchParams.get('copyFrom')
  const isCopy = Boolean(copyFromId)
  const sourceId = copyFromId || examId
  const { exam: sourceExam, loading: sourceLoading, error: sourceError } = useTeacherExamDetail(sourceId)
  const initializedSourceId = useRef<string | null>(null)
  const initialTypeFromUrl = (searchParams.get('type') as ExamType) || 'MULTIPLE_CHOICE'
  const initialSections = buildInitialSections(initialTypeFromUrl)

  const [activeStep, setActiveStep] = useState<WizardStepId>('INFO')
  const [title, setTitle] = useState(
    getDefaultTitle(initialTypeFromUrl),
  )
  const [description, setDescription] = useState(
    'Kiểm tra kiến thức theo nội dung lớp học phần.',
  )
  const [examCategory, setExamCategory] = useState<ExamCategory>('QUIZ')
  const [examType, setExamType] = useState<ExamType>(initialTypeFromUrl)
  const [subjectId, setSubjectId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [sections, setSections] = useState<ExamSection[]>(initialSections)
  const [activeSectionId, setActiveSectionId] = useState(initialSections[0].id)
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [targetTotalPoints, setTargetTotalPoints] = useState(10)

  const [questions, setQuestions] = useState<ExamQuestionItem[]>([])
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<string[]>([])

  const [isBankPickerOpen, setIsBankPickerOpen] = useState(false)
  const [isAiPdfOpen, setIsAiPdfOpen] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null)

  useEffect(() => {
    if (!sourceExam || initializedSourceId.current === sourceExam.id) return
    const nextSections = sourceExam.sections?.map((section) => ({ ...section }))
      ?? buildInitialSections(sourceExam.type)
    initializedSourceId.current = sourceExam.id
    setTitle(`${isCopy ? 'Bản sao - ' : ''}${sourceExam.title}`)
    setDescription(sourceExam.description)
    setExamCategory(sourceExam.category ?? 'QUIZ')
    setExamType(sourceExam.type)
    setSubjectId(sourceExam.subjectId)
    setSemesterId(sourceExam.semesterId)
    setSections(nextSections)
    setActiveSectionId(nextSections[0].id)
    setDurationMinutes(sourceExam.defaultDurationMinutes)
    setTargetTotalPoints(sourceExam.totalPoints)
    setQuestions(sourceExam.questions.map((item) => ({
      ...item, question: { ...item.question },
    })))
  }, [isCopy, sourceExam])

  useEffect(() => {
    if (!sourceId || sourceLoading || !sourceError) return
    toast.error(sourceError)
    navigate('/teacher/exams', { replace: true })
  }, [navigate, sourceError, sourceId, sourceLoading])

  const selectedSemesterId = semesterId || currentSemesterId || ''
  const semesterCourses = courses.filter((course) => course.semesterId === selectedSemesterId)
  const selectedSubjectId = semesterCourses.some((course) => course.subjectId === subjectId)
    ? subjectId
    : semesterCourses[0]?.subjectId ?? ''
  const selectedCourse = semesterCourses.find((course) => course.subjectId === selectedSubjectId)
  const selectedSubject = {
    subjectCode: selectedCourse?.subjectCode ?? '',
    subjectName: selectedCourse?.subjectName ?? 'Chưa chọn môn học',
  }
  const subjectOptions = Array.from(new Map(semesterCourses.map((course) => [course.subjectId, {
    value: course.subjectId, label: `${course.subjectCode} - ${course.subjectName}`,
  }])).values())
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

  const addQuestions = (selectedList: Question[], source: 'QUESTION_BANK' | 'INLINE') => {
    const allowedQuestions = selectedList.filter((q) => isQuestionAllowedForExam(q, examType))
    setQuestions((prev) => {
      const newItems: ExamQuestionItem[] = allowedQuestions.map((q, idx) => ({
        questionId: q.id,
        sourceQuestionId: source === 'QUESTION_BANK' ? q.id : null,
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
                sourceQuestionId: null,
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
      title: savedQ.title || '',
      content: savedQ.content || '',
      explanation: savedQ.explanation,
      options: savedQ.options,
      programmingLanguage: savedQ.programmingLanguage,
      timeLimitMs: savedQ.timeLimitMs,
      memoryLimitMb: savedQ.memoryLimitMb,
      testCases: savedQ.testCases,
      createdAt: 'Vừa xong',
    }
    addQuestions([newQuestion], 'INLINE')
  }

  const handleAutoBalancePoints = () => {
    if (questions.length === 0) return
    setQuestions((prev) => balanceQuestionPointsBySection(prev, sections))
  }

  const validateExam = () => {
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên bài thi.')
      setActiveStep('INFO')
      return false
    }
    if (!selectedSemesterId) {
      toast.error('Vui lòng chọn học kỳ của đề thi.')
      setActiveStep('INFO')
      return false
    }
    if (questions.length === 0) {
      toast.error('Bài thi cần có ít nhất một câu hỏi.')
      setActiveStep('QUESTIONS')
      return false
    }
    const sectionTargetTotal = sections.reduce((sum, section) => sum + (section.targetPoints ?? 0), 0)
    if (Math.abs(sectionTargetTotal - targetTotalPoints) >= 0.01) {
      toast.error(`Tổng điểm các phần là ${sectionTargetTotal.toFixed(2)}, phải bằng ${targetTotalPoints.toFixed(2)} điểm.`)
      setActiveStep('SECTIONS')
      return false
    }
    if (Math.abs(totalPoints - targetTotalPoints) >= 0.01) {
      toast.error(`Tổng điểm hiện tại là ${totalPoints.toFixed(2)}, phải bằng tổng điểm mục tiêu ${targetTotalPoints.toFixed(2)}.`)
      setActiveStep('QUESTIONS')
      return false
    }
    return true
  }

  const persistExam = async (submit: boolean) => {
    if (!validateExam()) return
    if (!selectedSubjectId) { toast.error('Vui lòng chọn môn học.'); return }
    const payload = {
      title: title.trim(), description: description.trim() || null,
      subjectId: selectedSubjectId, semesterId: selectedSemesterId,
      type: examCategory,
      format: examType === 'MULTIPLE_CHOICE' ? 'OBJECTIVE' as const : examType,
      creationMethod: sourceExam?.creationMethod ?? 'MANUAL' as const,
      defaultDurationMinutes: durationMinutes, totalPoints: targetTotalPoints,
      sections: sections.map((section) => ({
        id: section.id, title: section.title, description: section.description,
        type: section.type, targetPoints: section.targetPoints ?? 0, orderIndex: section.order,
      })),
    }
    try {
      const saved = !isCopy && sourceExam
        ? await examApi.updateTeacherExam(sourceExam.id, payload)
        : await examApi.createTeacherExam(payload)
      const orderedQuestions = orderQuestionsBySection(questions, sections)
      await examApi.replaceTeacherExamQuestions(saved.id, orderedQuestions.map(toExamQuestionInput))
      if (submit) await examApi.submitTeacherExam(saved.id)
      toast.success(
        submit
          ? examCategory === 'FINAL' && !isDepartmentHead
            ? 'Đã gửi đề thi cuối kỳ để duyệt.'
            : 'Đã hoàn tất đề thi.'
          : `Đã lưu nháp ${examTypeLabel[examType]} với ${questions.length} câu hỏi.`,
      )
      navigate('/teacher/exams')
    } catch {
      toast.error('Không thể lưu đề thi. Dữ liệu của bạn vẫn được giữ để thử lại.')
    }
  }

  const handleSaveDraft = () => { void persistExam(false) }
  const handlePublishExam = () => { void persistExam(true) }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
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
                  examCategory === 'FINAL' && !isDepartmentHead
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                <CheckCircle2 size={15} />
                {examCategory === 'FINAL' && !isDepartmentHead
                  ? 'Gửi duyệt đề thi'
                  : 'Tạo & Công bố đề'}
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
                  subjectId={selectedSubjectId}
                  setSubjectId={setSubjectId}
                  subjectOptions={subjectOptions}
                  semesterId={selectedSemesterId}
                  setSemesterId={setSemesterId}
                  semesterOptions={semesterOptions}
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
        onSelectQuestions={(selected) => addQuestions(selected, 'QUESTION_BANK')}
        existingQuestionIds={questions.map((q) => q.questionId)}
        examType={examType}
        questions={bankQuestions}
        targetSubjectId={selectedSubjectId}
      />

      {isAiPdfOpen && (
        <AIPdfGeneratorModal
          onClose={() => setIsAiPdfOpen(false)}
          onApprovedAdd={(selected) => addQuestions(selected, 'INLINE')}
          examType={examType}
          subjectId={selectedSubjectId}
        />
      )}

      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingQuestion(null)
        }}
        onSave={handleSaveQuestion}
        initialQuestion={editingQuestion}
        examType={examType}
        subjects={subjects}
      />
    </div>
  )
}
