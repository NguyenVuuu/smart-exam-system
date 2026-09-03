import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileText,
  HardDrive,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  Upload,
  XCircle,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import AppSelect from '../../components/common/AppSelect'
import { getApiErrorMessage } from '../../api/errors'
import FileSelectionList from './components/FileSelectionList'
import TeacherPageHeader from './components/TeacherPageHeader'
import TeacherSidebar from './components/TeacherSidebar'
import TeacherTopBar from './components/TeacherTopBar'
import { QuestionProgrammingEditor } from './components/question-bank/editor/QuestionProgrammingEditor'
import {
  generateAiQuestions,
  getAiMaterials,
  saveApprovedAiQuestions,
  uploadAiSourceFiles,
} from './api/teacher-questions.api'
import { useTeacherQuestions } from './hooks/useTeacherQuestions'
import type { AIDraftQuestion, DifficultyLevel } from './types/teacher-question-bank.types'
import type { AiMaterialDto } from './types/teacher-question-api.types'

type SourceMode = 'COURSE_MATERIAL' | 'UPLOAD_FILE'
type AiMode = 'GENERATE_FROM_MATERIAL' | 'EXTRACT_EXISTING_EXAM'
type DesiredDifficulty = DifficultyLevel | 'AUTO'

const sourceOptions: Array<{ value: SourceMode; title: string; description: string }> = [
  {
    value: 'COURSE_MATERIAL',
    title: 'Tài liệu lớp học',
    description: 'File đã upload trong lớp.',
  },
  {
    value: 'UPLOAD_FILE',
    title: 'Tải file mới',
    description: 'File riêng cho lần sinh này.',
  },
]

const modeOptions: Array<{ value: AiMode; title: string; description: string }> = [
  {
    value: 'GENERATE_FROM_MATERIAL',
    title: 'Sinh câu hỏi từ tài liệu',
    description: 'Tạo câu hỏi mới từ nội dung file.',
  },
  {
    value: 'EXTRACT_EXISTING_EXAM',
    title: 'Bóc tách đề có sẵn',
    description: 'Tách câu hỏi và đáp án từ đề.',
  },
]

const difficultyOptions: Array<{ value: DesiredDifficulty; label: string }> = [
  { value: 'AUTO', label: 'Tự phân bổ độ khó' },
  { value: 'EASY', label: 'Dễ' },
  { value: 'MEDIUM', label: 'Trung bình' },
  { value: 'HARD', label: 'Khó' },
]

const difficultyLabel: Record<DifficultyLevel, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

const difficultyTone: Record<DifficultyLevel, string> = {
  EASY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  HARD: 'border-rose-200 bg-rose-50 text-rose-700',
}

const statusLabel: Record<AIDraftQuestion['status'], string> = {
  PENDING_REVIEW: 'Chờ duyệt',
  APPROVED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
}

const questionTypeLabel: Record<string, string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

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
      const result = await generateAiQuestions({
        subjectId: selectedSubjectId,
        sourceType: sourceMode,
        mode: aiMode,
        materialIds: sourceMode === 'COURSE_MATERIAL' ? selectedMaterials : [],
        sourceFiles: uploadedSources,
        prompt: promptInput,
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
        content: question.content,
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
          content: item.type === 'PROGRAMMING' ? item.content : item.content,
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
            <section ref={configSectionRef} className="space-y-5 rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
              <div>
                <h2 className="text-sm font-bold text-gray-950">Cấu hình AI</h2>
                <p className="mt-1 text-xs text-gray-500">
                  AI tạo câu hỏi nháp, giảng viên duyệt rồi mới lưu.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-gray-900">Môn học</label>
                <AppSelect
                  value={selectedSubjectId}
                  onChange={(value) => {
                    setSubjectId(value)
                    setSelectedMaterials([])
                    setMaterialsLoading(true)
                  }}
                  buttonClassName="bg-white"
                  options={subjectOptions}
                />
                <p className="mt-2 text-xs text-gray-500">
                  File tải mới hoặc tài liệu lớp học đều sẽ sinh câu hỏi cho môn này.
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-900">Nguồn dữ liệu</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {sourceOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setSourceMode(option.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        sourceMode === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-gray-950">{option.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {sourceMode === 'COURSE_MATERIAL' ? (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-900">Tài liệu lớp học</label>
                    <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
                      {materialsLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 p-5 text-xs text-gray-500">
                          <Loader2 size={15} className="animate-spin" />
                          Đang tải tài liệu...
                        </div>
                      ) : materials.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
                          Chưa có tài liệu nào thuộc môn đã chọn.
                        </div>
                      ) : materials.map((material) => {
                        const checked = selectedMaterials.includes(material.id)
                        return (
                          <label
                            key={material.id}
                            className={`relative flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border p-3 pr-24 transition-colors ${
                              checked ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => toggleMaterial(material.id, event.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <FileText size={16} className="text-blue-600" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-gray-900">
                                {material.fileName}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                {material.courseCode} - {formatFileSize(material.fileSize)} - {material.contentType}
                              </span>
                              {material.duplicated && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-700">
                                  Trùng nội dung
                                </span>
                              )}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                    <p className="text-xs text-gray-500">
                      File trùng được nhận biết bằng checksum.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <label className="block cursor-pointer rounded-xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-6 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/60">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        if (files.length) setUploadedFiles(files)
                        event.currentTarget.value = ''
                      }}
                    />
                    <Upload size={22} className="mx-auto text-blue-600" />
                    <p className="mt-2 text-xs font-bold text-gray-900">Chọn một hoặc nhiều file PDF, DOCX, TXT, PNG, JPG</p>
                    <p className="mt-1 inline-flex items-center gap-1 text-xs text-gray-400">
                      <HardDrive size={13} />
                      File sẽ lưu Supabase, checksum tính ở backend khi upload.
                    </p>
                  </label>
                  <FileSelectionList
                    files={uploadedFiles}
                    onRemove={removeUploadedFile}
                    onClear={() => setUploadedFiles([])}
                  />
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-900">Chế độ xử lý</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {modeOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setAiMode(option.value)}
                      className={`rounded-xl border p-3 text-left transition-colors ${
                        aiMode === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:bg-gray-50'
                      }`}
                    >
                      <p className="text-xs font-bold text-gray-950">{option.title}</p>
                      <p className="mt-1 text-xs leading-5 text-gray-500">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {aiMode === 'GENERATE_FROM_MATERIAL' ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Số câu muốn sinh</label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={questionCount}
                        onChange={(event) => setQuestionCount(Number(event.target.value))}
                        className="h-11 w-full rounded-xl border border-gray-200 bg-gray-50 px-3 text-sm font-semibold outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-gray-700">Độ khó</label>
                      <AppSelect
                        value={desiredDifficulty}
                        onChange={(value) => setDesiredDifficulty(value as DesiredDifficulty)}
                        buttonClassName="bg-gray-50"
                        options={difficultyOptions}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Cách lấy số câu</label>
                    <input
                      disabled
                      value="Tự nhận diện theo đề"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-gray-100 px-3 text-sm font-semibold text-gray-600"
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Yêu cầu thêm cho AI</label>
                <textarea
                  rows={7}
                  value={promptInput}
                  onChange={(event) => setPromptInput(event.target.value)}
                  placeholder="Ví dụ: tạo đáp án nhiễu hợp lý, tránh câu hỏi mẹo, ưu tiên kiến thức chương kế thừa..."
                  className="min-h-40 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white shadow-md shadow-blue-500/20 transition-colors hover:bg-blue-700 disabled:opacity-60"
              >
                {isGenerating ? <Loader2 size={17} className="animate-spin" /> : <Sparkles size={17} />}
                {isGenerating ? 'AI đang xử lý...' : 'Sinh câu hỏi'}
              </button>
            </section>

            <section
              className="flex min-h-[620px] flex-col overflow-hidden rounded-xl border border-gray-100 bg-white p-5 shadow-sm xl:min-h-0"
              style={draftPanelHeight ? { height: draftPanelHeight } : undefined}
            >
              <div className="flex items-center justify-between gap-3 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-bold text-gray-950">Câu hỏi nháp</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    Duyệt từng câu trước khi lưu vào ngân hàng cá nhân.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {draftQuestions.length > 0 && (
                    <>
                      <button
                        type="button"
                        onClick={handleApproveAllAvailable}
                        className="flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700 transition-colors hover:bg-emerald-100"
                      >
                        <CheckCircle2 size={14} />
                        Chấp nhận tất cả
                      </button>
                      <button
                        type="button"
                        onClick={clearDraftQuestions}
                        className="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-bold text-gray-600 transition-colors hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 size={14} />
                        Xóa nháp
                      </button>
                    </>
                  )}
                  <span className="rounded-lg bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                    {draftQuestions.filter((item) => item.status === 'APPROVED').length} / {draftQuestions.length} đã duyệt
                  </span>
                </div>
              </div>

              {draftQuestions.length === 0 ? (
                <div className="flex min-h-[460px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 text-center">
                  <Sparkles size={28} className="text-blue-500" />
                  <p className="mt-3 text-sm font-bold text-gray-950">Chưa có câu hỏi nháp</p>
                  <p className="mt-1 max-w-sm text-xs text-gray-500">
                    Chọn nguồn dữ liệu và chế độ xử lý, sau đó bấm sinh câu hỏi.
                  </p>
                </div>
              ) : (
                <div className="mt-4 min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                  {draftQuestions.map((question, index) => {
                    const isCollapsed = collapsedDraftQuestionIds.includes(question.id)
                    return (
                    <article key={question.id} className="rounded-xl border border-gray-200 bg-white p-4 text-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-blue-700">
                              Câu nháp #{index + 1}
                            </span>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-600">
                              {questionTypeLabel[question.type] || question.type}
                            </span>
                            <span className={`inline-flex rounded-md border px-2 py-0.5 text-[11px] font-bold ${difficultyTone[question.difficulty]}`}>
                              {difficultyLabel[question.difficulty]}
                            </span>
                          </div>
                          {isCollapsed && (
                            <p className="mt-1.5 truncate text-sm font-semibold text-gray-950">
                              {question.title || question.content || 'Chưa có tiêu đề'}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={`rounded-lg px-2.5 py-1 text-xs font-bold ${
                              question.status === 'APPROVED'
                                ? 'bg-emerald-50 text-emerald-700'
                                : question.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {statusLabel[question.status]}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleDraftQuestionCollapse(question.id)}
                            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                            title={isCollapsed ? 'Mở câu hỏi' : 'Thu gọn câu hỏi'}
                          >
                            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
                          </button>
                        </div>
                      </div>

                      {!isCollapsed && (
                        <>
                      {question.aiDifficultyReason && (
                        <p className="mt-3 text-xs leading-5 text-gray-500">
                          <span className="font-semibold text-gray-600">Lý do xếp độ khó:</span> {question.aiDifficultyReason}
                        </p>
                      )}
                      {question.type === 'PROGRAMMING' ? (
                        <>
                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Tiêu đề bài</label>
                            <input
                              value={question.title}
                              onChange={(event) => updateDraftField(question.id, 'title', event.target.value)}
                              className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Mô tả bài toán</label>
                            <textarea
                              rows={4}
                              value={question.content}
                              onChange={(event) => updateDraftField(question.id, 'content', event.target.value)}
                              className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm leading-6 text-gray-800 outline-none focus:border-blue-500"
                            />
                          </div>
                          <div className="mt-3">
                            <QuestionProgrammingEditor
                              programmingLanguage={question.programmingLanguage ?? 'JAVA'}
                              onLanguageChange={(value) => updateDraftField(question.id, 'programmingLanguage', value)}
                              timeLimitMs={question.timeLimitMs ?? 2000}
                              onTimeLimitChange={(value) => updateDraftField(question.id, 'timeLimitMs', value)}
                              memoryLimitMb={question.memoryLimitMb ?? 256}
                              onMemoryLimitChange={(value) => updateDraftField(question.id, 'memoryLimitMb', value)}
                              maxCodeSizeKb={question.maxCodeSizeKb ?? 256}
                              onMaxCodeSizeChange={(value) => updateDraftField(question.id, 'maxCodeSizeKb', value)}
                              testCases={question.testCases ?? []}
                              onTestCasesChange={(testCases) => updateDraftTestCases(question.id, testCases)}
                              expandedTcIds={expandedDraftTestCaseIds[question.id] ?? []}
                              onToggleExpandTc={(testCaseId) => toggleDraftTestCase(question.id, testCaseId)}
                            />
                          </div>
                        </>
                      ) : (
                        <div className="mt-3">
                          <label className="mb-1 block text-xs font-semibold text-gray-600">Câu hỏi</label>
                          <textarea
                            rows={2}
                            value={question.content || question.title}
                            onChange={(event) => {
                              updateDraftField(question.id, 'content', event.target.value)
                              updateDraftField(question.id, 'title', event.target.value)
                            }}
                            className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold leading-6 text-gray-950 outline-none focus:border-blue-500"
                          />
                        </div>
                      )}

                      {question.options && (
                        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                          {question.options.map((option, optionIndex) => (
                            <label
                              key={option.id}
                              className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${
                                option.isCorrect
                                  ? 'border-emerald-200 bg-emerald-50 font-semibold text-emerald-800'
                                  : 'border-gray-200 bg-gray-50 text-gray-700'
                              }`}
                            >
                              <input
                                type={question.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                name={`correct-${question.id}`}
                                checked={option.isCorrect}
                                onChange={(event) =>
                                  updateDraftOptionCorrect(question.id, option.id, event.target.checked)
                                }
                                className="shrink-0 text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="shrink-0 font-bold">{String.fromCharCode(65 + optionIndex)}.</span>
                              <input
                                value={option.content}
                                onChange={(event) =>
                                  updateDraftOptionContent(question.id, option.id, event.target.value)
                                }
                                className="min-w-0 flex-1 bg-transparent outline-none"
                              />
                              {option.isCorrect && <Check size={14} className="shrink-0 text-emerald-600" />}
                            </label>
                          ))}
                        </div>
                      )}

                      <div className="mt-3">
                        <label className="mb-1 block text-xs font-semibold text-gray-600">Giải thích</label>
                        <textarea
                          rows={2}
                          value={question.explanation ?? ''}
                          onChange={(event) => updateDraftField(question.id, 'explanation', event.target.value)}
                          className="w-full resize-y rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs leading-5 text-blue-800 outline-none focus:border-blue-400"
                          placeholder="Nhập hoặc chỉnh giải thích đáp án..."
                        />
                      </div>

                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-3">
                        <span className="text-xs text-gray-400">Nguồn: {question.sourceMaterialName}</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateDraftStatus(question.id, 'REJECTED')}
                            className="flex items-center gap-1 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100"
                          >
                            <XCircle size={14} />
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraftStatus(question.id, 'APPROVED')}
                            className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 size={14} />
                            Chấp nhận
                          </button>
                        </div>
                      </div>
                        </>
                      )}
                    </article>
                    )
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
