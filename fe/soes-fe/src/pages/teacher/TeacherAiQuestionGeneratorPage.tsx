import { ArrowLeft, Loader2, Save, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../api/errors'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import {
  AiGeneratorConfigPanel,
  type AiMode,
  type DesiredDifficulty,
  type SourceMode,
  type TargetQuestionType,
} from './components/ai-generator/AiGeneratorConfigPanel'
import { AiDraftQuestionsPanel } from './components/ai-generator/AiDraftQuestionsPanel'
import { formatPlainTextToHtml } from './utils/formatHtml.utils'
import {
  generateAiQuestions,
  getAiMaterials,
  saveApprovedAiQuestions,
  uploadAiSourceFiles,
} from './api/teacher-questions.api'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import type { AIDraftQuestion } from './types/teacher-question-bank.types'
import type { AiMaterialDto } from './types/teacher-question-api.types'

const aiDraftStorageKey = 'teacher-ai-question-drafts'

function loadStoredDraftQuestions() {
  if (typeof window === 'undefined') return []
  try {
    const value = window.sessionStorage.getItem(aiDraftStorageKey)
    return value ? (JSON.parse(value) as AIDraftQuestion[]) : []
  } catch {
    return []
  }
}

export default function TeacherAiQuestionGeneratorPage() {
  const navigate = useNavigate()
  const { subjects } = useTeacherQuestions()
  const subjectOptions = subjects.map((subject) => ({ value: subject.id, label: subject.name }))
  const [sourceMode, setSourceMode] = useState<SourceMode>('COURSE_MATERIAL')
  const [aiMode, setAiMode] = useState<AiMode>('GENERATE_FROM_MATERIAL')
  const [subjectId, setSubjectId] = useState('')
  const [materials, setMaterials] = useState<AiMaterialDto[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(false)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [questionCount, setQuestionCount] = useState(5)
  const [desiredDifficulty, setDesiredDifficulty] = useState<DesiredDifficulty>('AUTO')
  const [targetQuestionType, setTargetQuestionType] = useState<TargetQuestionType>('ALL')
  const [promptInput, setPromptInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [draftQuestions, setDraftQuestions] = useState<AIDraftQuestion[]>(loadStoredDraftQuestions)
  const [collapsedDraftQuestionIds, setCollapsedDraftQuestionIds] = useState<string[]>([])
  const [expandedDraftTestCaseIds, setExpandedDraftTestCaseIds] = useState<Record<string, string[]>>({})
  const configSectionRef = useRef<HTMLElement>(null)
  const [draftPanelHeight, setDraftPanelHeight] = useState<number | undefined>()
  const selectedSubjectId = subjectId || subjects[0]?.id || ''
  const selectedCourseMaterials = materials.filter((material) => selectedMaterials.includes(material.id))

  useEffect(() => {
    if (draftQuestions.length === 0) {
      window.sessionStorage.removeItem(aiDraftStorageKey)
      return
    }
    window.sessionStorage.setItem(aiDraftStorageKey, JSON.stringify(draftQuestions))
  }, [draftQuestions])

  useEffect(() => {
    const element = configSectionRef.current
    if (!element) return

    const updateHeight = () => {
      setDraftPanelHeight(
        window.matchMedia('(min-width: 1280px)').matches
          ? Math.ceil(element.getBoundingClientRect().height)
          : undefined,
      )
    }
    const observer = new ResizeObserver(updateHeight)

    updateHeight()
    observer.observe(element)
    window.addEventListener('resize', updateHeight)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', updateHeight)
    }
  }, [sourceMode, aiMode, uploadedFiles.length, materials.length])

  useEffect(() => {
    if (!selectedSubjectId) return
    let active = true
    getAiMaterials(selectedSubjectId)
      .then((items) => {
        if (active) setMaterials(items)
      })
      .catch((error) => {
        if (active) {
          setMaterials([])
          toast.error(getApiErrorMessage(error, 'Không thể tải tài liệu lớp học.'))
        }
      })
      .finally(() => {
        if (active) setMaterialsLoading(false)
      })
    return () => {
      active = false
    }
  }, [selectedSubjectId])

  const removeUploadedFile = (index: number) => {
    setUploadedFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const toggleMaterial = (materialId: string, checked: boolean) => {
    setSelectedMaterials((prev) =>
      checked ? [...prev, materialId] : prev.filter((item) => item !== materialId),
    )
  }

  const handleGenerate = async () => {
    if (!selectedSubjectId) {
      toast.error('Vui lòng chọn môn học để AI gán câu hỏi đúng ngân hàng.')
      return
    }
    if (sourceMode === 'COURSE_MATERIAL' && selectedCourseMaterials.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu lớp học.')
      return
    }
    if (sourceMode === 'UPLOAD_FILE' && uploadedFiles.length === 0) {
      toast.error('Vui lòng chọn ít nhất một file để AI xử lý.')
      return
    }

    setIsGenerating(true)
    try {
      const uploadedSources = sourceMode === 'UPLOAD_FILE'
        ? await uploadAiSourceFiles(selectedSubjectId, uploadedFiles)
        : []
      const typeConstraint = {
        ALL: '',
        MULTIPLE_CHOICE: 'Chỉ tạo câu hỏi trắc nghiệm (SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE). Tuyệt đối không tạo bài tập lập trình PROGRAMMING.',
        PROGRAMMING: 'Chỉ tạo bài tập lập trình console (PROGRAMMING) yêu cầu sinh viên tự viết code giải thuật hoàn chỉnh với luồng stdin/stdout và testCases tự động. Tuyệt đối không tạo câu hỏi trắc nghiệm hay câu hỏi đọc hiểu đoạn code có sẵn.',
      }[targetQuestionType]
      const combinedPrompt = [typeConstraint, promptInput.trim()].filter(Boolean).join('\n')
      const result = await generateAiQuestions({
        subjectId: selectedSubjectId,
        sourceType: sourceMode,
        mode: aiMode,
        materialIds: sourceMode === 'COURSE_MATERIAL' ? selectedMaterials : [],
        sourceFiles: uploadedSources,
        prompt: combinedPrompt,
        questionCount,
        difficulty: desiredDifficulty,
      })
      const generatedQuestions: AIDraftQuestion[] = result.questions.map((question) => ({
        id: question.id,
        generationId: result.historyId,
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        teacherId: '',
        teacherName: 'AI',
        type: question.type,
        difficulty: question.difficulty,
        aiDifficultyReason: question.difficultyReason,
        title: question.title,
        content: question.type === 'PROGRAMMING' ? formatPlainTextToHtml(question.content) : question.content,
        explanation: question.explanation,
        options: question.options.map((option, index) => ({
          ...option,
          id: `${question.id}-option-${index}`,
        })),
        programmingLanguage: question.language ?? undefined,
        timeLimitMs: question.timeLimitMs,
        memoryLimitMb: question.memoryLimitMb,
        maxCodeSizeKb: question.maxCodeSizeKb,
        testCases: question.testCases.map((testCase, index) => ({
          ...testCase,
          id: `${question.id}-test-${index}`,
        })),
        status: 'PENDING_REVIEW',
        sourceMaterialName: question.sourceMaterialName,
        createdAt: new Date().toISOString(),
      }))

      setDraftQuestions((prev) => [...prev, ...generatedQuestions])
      toast.success(draftQuestions.length > 0 ? 'Đã thêm câu hỏi mới vào danh sách nháp.' : 'AI đã tạo danh sách câu hỏi nháp.')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'AI không thể xử lý tài liệu đã chọn.'))
    } finally {
      setIsGenerating(false)
    }
  }

  const updateDraftStatus = (id: string, status: AIDraftQuestion['status']) => {
    setDraftQuestions((prev) => prev.map((item) => (item.id === id ? { ...item, status } : item)))
  }

  const updateDraftField = <K extends keyof AIDraftQuestion>(
    id: string,
    field: K,
    value: AIDraftQuestion[K],
  ) => {
    setDraftQuestions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const updateDraftOptionContent = (questionId: string, optionId: string, content: string) => {
    setDraftQuestions((prev) =>
      prev.map((item) =>
        item.id === questionId
          ? {
              ...item,
              options: item.options?.map((option) =>
                option.id === optionId ? { ...option, content } : option,
              ),
            }
          : item,
      ),
    )
  }

  const updateDraftOptionCorrect = (questionId: string, optionId: string, checked: boolean) => {
    setDraftQuestions((prev) =>
      prev.map((item) => {
        if (item.id !== questionId) return item

        return {
          ...item,
          options: item.options?.map((option) => {
            if (item.type === 'SINGLE_CHOICE' || item.type === 'TRUE_FALSE') {
              return { ...option, isCorrect: option.id === optionId }
            }
            return option.id === optionId ? { ...option, isCorrect: checked } : option
          }),
        }
      }),
    )
  }

  const updateDraftTestCases = (
    questionId: string,
    testCases: NonNullable<AIDraftQuestion['testCases']>,
  ) => {
    setDraftQuestions((prev) =>
      prev.map((item) =>
        item.id === questionId
          ? { ...item, testCases }
          : item,
      ),
    )
  }

  const toggleDraftTestCase = (questionId: string, testCaseId: string) => {
    setExpandedDraftTestCaseIds((current) => {
      const ids = current[questionId] ?? []
      return {
        ...current,
        [questionId]: ids.includes(testCaseId)
          ? ids.filter((id) => id !== testCaseId)
          : [...ids, testCaseId],
      }
    })
  }

  const toggleDraftQuestionCollapse = (questionId: string) => {
    setCollapsedDraftQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    )
  }

  const clearDraftQuestions = () => {
    setDraftQuestions([])
    window.sessionStorage.removeItem(aiDraftStorageKey)
  }

  const handleApproveAllAvailable = () => {
    const approvableCount = draftQuestions.filter((item) => item.status !== 'REJECTED').length
    if (!approvableCount) {
      toast.error('Không còn câu nháp nào có thể chấp nhận.')
      return
    }

    setDraftQuestions((prev) =>
      prev.map((item) => (item.status === 'REJECTED' ? item : { ...item, status: 'APPROVED' })),
    )
    toast.success(`Đã chấp nhận ${approvableCount} câu nháp, bỏ qua các câu đã từ chối.`)
  }

  const handleSaveApproved = async () => {
    const approved = draftQuestions.filter((item) => item.status === 'APPROVED' && item.generationId)
    if (!approved.length) {
      toast.error('Vui lòng duyệt ít nhất một câu hỏi trước khi lưu.')
      return
    }
    setIsSaving(true)
    try {
      const result = await saveApprovedAiQuestions(approved.map((item) => ({
        generationId: item.generationId!,
        subjectId: item.subjectId,
        question: {
          title: item.type === 'PROGRAMMING' ? item.title : item.content,
          content: item.type === 'PROGRAMMING' ? formatPlainTextToHtml(item.content) : item.content,
          explanation: item.explanation ?? '',
          type: item.type,
          difficulty: item.difficulty,
          difficultyReason: item.aiDifficultyReason ?? 'Giảng viên đã rà soát mức độ khó.',
          language: item.type === 'PROGRAMMING' ? item.programmingLanguage ?? null : null,
          options: (item.options ?? []).map(({ content, isCorrect }) => ({ content, isCorrect })),
          timeLimitMs: item.timeLimitMs ?? 2000,
          memoryLimitMb: item.memoryLimitMb ?? 256,
          maxCodeSizeKb: item.maxCodeSizeKb ?? 256,
          testCases: (item.testCases ?? []).map(({ input, expectedOutput, isHidden }) => ({
            input,
            expectedOutput,
            isHidden,
          })),
        },
      })))
      toast.success(`Đã lưu ${result.count} câu hỏi AI vào ngân hàng cá nhân.`)
      window.sessionStorage.removeItem(aiDraftStorageKey)
      navigate('/teacher/question-bank')
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu câu hỏi AI đã duyệt.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 font-sans text-slate-800">
      <TeacherSidebar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TeacherTopBar />

        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden px-6 py-7 lg:px-8">
          <button
            type="button"
            onClick={() => navigate('/teacher/question-bank')}
            className="mb-5 flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-gray-900"
          >
            <ArrowLeft size={16} />
            Quay lại ngân hàng câu hỏi
          </button>

          <TeacherPageHeader
            title="Tạo câu hỏi bằng AI"
            description="Sinh câu hỏi từ tài liệu học tập hoặc bóc tách đề có sẵn thành câu hỏi nháp để giảng viên duyệt."
            icon={<Sparkles size={21} />}
            actions={
              <button
                type="button"
                onClick={handleSaveApproved}
                disabled={draftQuestions.length === 0 || isSaving}
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 disabled:shadow-none"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'Đang lưu...' : 'Lưu câu đã duyệt'}
              </button>
            }
          />

          <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[480px_minmax(0,1fr)]">
            <AiGeneratorConfigPanel
              configSectionRef={configSectionRef}
              selectedSubjectId={selectedSubjectId}
              subjectOptions={subjectOptions}
              onSubjectChange={(value) => {
                setSubjectId(value)
                setSelectedMaterials([])
                setMaterialsLoading(true)
              }}
              sourceMode={sourceMode}
              onSourceModeChange={setSourceMode}
              materials={materials}
              materialsLoading={materialsLoading}
              selectedMaterials={selectedMaterials}
              onToggleMaterial={toggleMaterial}
              uploadedFiles={uploadedFiles}
              onAddFiles={(files) => setUploadedFiles(files)}
              onRemoveUploadedFile={removeUploadedFile}
              onClearUploadedFiles={() => setUploadedFiles([])}
              aiMode={aiMode}
              onAiModeChange={setAiMode}
              targetQuestionType={targetQuestionType}
              onTargetQuestionTypeChange={setTargetQuestionType}
              desiredDifficulty={desiredDifficulty}
              onDesiredDifficultyChange={setDesiredDifficulty}
              questionCount={questionCount}
              onQuestionCountChange={setQuestionCount}
              promptInput={promptInput}
              onPromptInputChange={setPromptInput}
              isGenerating={isGenerating}
              onGenerate={handleGenerate}
            />

            <AiDraftQuestionsPanel
              draftPanelHeight={draftPanelHeight}
              draftQuestions={draftQuestions}
              isGenerating={isGenerating}
              aiMode={aiMode}
              collapsedDraftQuestionIds={collapsedDraftQuestionIds}
              expandedDraftTestCaseIds={expandedDraftTestCaseIds}
              onApproveAllAvailable={handleApproveAllAvailable}
              onClearDraftQuestions={clearDraftQuestions}
              onToggleDraftQuestionCollapse={toggleDraftQuestionCollapse}
              onToggleDraftTestCase={toggleDraftTestCase}
              onUpdateDraftField={updateDraftField}
              onUpdateDraftOptionContent={updateDraftOptionContent}
              onUpdateDraftOptionCorrect={updateDraftOptionCorrect}
              onUpdateDraftTestCases={updateDraftTestCases}
              onUpdateDraftStatus={updateDraftStatus}
            />
          </div>
        </main>
      </div>
    </div>
  )
}
