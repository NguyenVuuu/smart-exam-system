import { Check, CheckCircle2, ChevronDown, ChevronUp, FileText, Loader2, RefreshCw, Sparkles, Trash2, Upload, X, XCircle } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { getApiErrorMessage } from '../../../../api/errors'
import FileSelectionList from '../FileSelectionList'
import { QuestionProgrammingEditor } from '../question-bank/editor/QuestionProgrammingEditor'
import RichTextEditor from '../question-bank/editor/RichTextEditor'
import { formatPlainTextToHtml } from '../../utils/formatHtml.utils'
import {
  generateAiQuestions,
  getAiMaterials,
  uploadAiSourceFiles,
} from '../../api/teacher-questions.api'
import type { ExamType } from '../../types/teacher-exam.types'
import type { AiMaterialDto } from '../../types/teacher-question-api.types'
import type { DifficultyLevel, Question } from '../../types/teacher-question-bank.types'
import { validateQuestion } from '../../utils/QuestionValidation'

interface AIPdfGeneratorModalProps {
  onClose: () => void
  onApprovedAdd: (generatedQuestions: Question[]) => void
  examType: ExamType
  subjectId: string
}

const formatFileSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

const difficultyLabel: Record<DifficultyLevel, string> = {
  EASY: 'Dễ',
  MEDIUM: 'Trung bình',
  HARD: 'Khó',
}

const questionTypeLabel: Record<string, string> = {
  SINGLE_CHOICE: 'Một đáp án',
  MULTIPLE_CHOICE: 'Nhiều đáp án',
  TRUE_FALSE: 'Đúng / Sai',
  PROGRAMMING: 'Lập trình',
}

const difficultyTone: Record<DifficultyLevel, string> = {
  EASY: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  MEDIUM: 'border-amber-200 bg-amber-50 text-amber-700',
  HARD: 'border-rose-200 bg-rose-50 text-rose-700',
}

const examAiDraftStoragePrefix = 'teacher-exam-ai-question-drafts'

function buildExamAiDraftStorageKey(subjectId: string, examType: ExamType) {
  return `${examAiDraftStoragePrefix}:${subjectId || 'unknown'}:${examType}`
}

function loadStoredExamAiDraft(storageKey: string) {
  if (typeof window === 'undefined') return []

  try {
    const value = window.sessionStorage.getItem(storageKey)
    return value ? (JSON.parse(value) as Question[]) : []
  } catch {
    return []
  }
}

export default function AIPdfGeneratorModal({
  onClose,
  onApprovedAdd,
  examType,
  subjectId,
}: AIPdfGeneratorModalProps) {
  const storageKey = buildExamAiDraftStorageKey(subjectId, examType)
  const storedGeneratedQuestions = loadStoredExamAiDraft(storageKey)
  const [step, setStep] = useState<1 | 2>(storedGeneratedQuestions.length > 0 ? 2 : 1)
  const [sourceMode, setSourceMode] = useState<'UPLOAD_FILE' | 'COURSE_MATERIAL'>('UPLOAD_FILE')
  const [sourceFiles, setSourceFiles] = useState<File[]>([])
  const [aiMode, setAiMode] = useState<'EXTRACT_EXISTING_EXAM' | 'GENERATE_FROM_MATERIAL'>('EXTRACT_EXISTING_EXAM')
  const [questionCount, setQuestionCount] = useState<number>(3)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedList, setGeneratedList] = useState<Question[]>(storedGeneratedQuestions)
  const [collapsedQuestionIds, setCollapsedQuestionIds] = useState<string[]>([])
  const [expandedTestCaseIds, setExpandedTestCaseIds] = useState<Record<string, string[]>>({})
  const [materials, setMaterials] = useState<AiMaterialDto[]>([])
  const [materialsLoading, setMaterialsLoading] = useState(true)
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([])

  useEffect(() => {
    if (!subjectId) return

    let active = true
    getAiMaterials(subjectId)
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
  }, [subjectId])

  useEffect(() => {
    if (generatedList.length === 0) {
      window.sessionStorage.removeItem(storageKey)
      return
    }

    window.sessionStorage.setItem(storageKey, JSON.stringify(generatedList))
  }, [generatedList, storageKey])

  const removeSourceFile = (index: number) => {
    setSourceFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const toggleMaterial = (materialId: string, checked: boolean) => {
    setSelectedMaterialIds((current) =>
      checked
        ? [...new Set([...current, materialId])]
        : current.filter((id) => id !== materialId),
    )
  }

  const handleStartGenerate = async () => {
    if (!subjectId) {
      toast.error('Vui lòng chọn môn học cho đề trước khi dùng AI.')
      return
    }
    if (aiMode === 'GENERATE_FROM_MATERIAL' && (!Number.isInteger(questionCount) || questionCount < 1 || questionCount > 50)) {
      toast.error('Số câu muốn sinh phải từ 1 đến 50.')
      return
    }
    if (sourceMode === 'UPLOAD_FILE' && sourceFiles.length === 0) {
      toast.error('Vui lòng chọn file để AI xử lý.')
      return
    }
    if (sourceMode === 'COURSE_MATERIAL' && selectedMaterialIds.length === 0) {
      toast.error('Vui lòng chọn ít nhất một tài liệu lớp học.')
      return
    }

    setIsGenerating(true)
    try {
      const uploadedSources = sourceMode === 'UPLOAD_FILE'
        ? await uploadAiSourceFiles(subjectId, sourceFiles)
        : []
      const examConstraint = {
        MULTIPLE_CHOICE: 'Chỉ tạo câu hỏi trắc nghiệm, không tạo câu hỏi lập trình.',
        PROGRAMMING: 'Chỉ tạo câu hỏi lập trình console dạng PROGRAMMING. Mỗi câu phải có language, timeLimitMs, memoryLimitMb, maxCodeSizeKb và testCases chấm tự động.',
        MIXED: 'Có thể tạo cả câu hỏi trắc nghiệm và câu hỏi lập trình phù hợp với tài liệu. Với câu lập trình phải có đầy đủ testCases chấm tự động.',
      }[examType]
      const result = await generateAiQuestions({
        subjectId,
        sourceType: sourceMode,
        mode: aiMode,
        materialIds: sourceMode === 'COURSE_MATERIAL' ? selectedMaterialIds : [],
        sourceFiles: uploadedSources,
        prompt: [examConstraint, customPrompt.trim()].filter(Boolean).join('\n'),
        questionCount: aiMode === 'GENERATE_FROM_MATERIAL' ? questionCount : undefined,
        difficulty: 'AUTO',
      })
      setGeneratedList(result.questions.map((question) => ({
        id: question.id,
        subjectId: question.subjectId,
        subjectName: question.subjectName,
        teacherId: '',
        teacherName: 'AI',
        type: question.type,
        difficulty: question.difficulty,
        aiDifficultyReason: question.difficultyReason,
        title: question.title,
        content: question.type === 'PROGRAMMING' ? formatPlainTextToHtml(question.content) : question.title,
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
        createdAt: new Date().toISOString(),
      })))
      setStep(2)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'AI không thể xử lý tài liệu đã chọn.'))
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmAddAll = () => {
    const invalidIndex = generatedList.findIndex(
      (question) => validateQuestion(question).length > 0,
    )
    if (invalidIndex >= 0) {
      const firstError = validateQuestion(generatedList[invalidIndex])[0]
      toast.error(`Câu ${invalidIndex + 1}: ${firstError}`)
      return
    }
    const sanitizedList = generatedList.map((q) => ({
      ...q,
      content: q.type === 'PROGRAMMING' ? formatPlainTextToHtml(q.content) : q.content,
    }))
    onApprovedAdd(sanitizedList)
    window.sessionStorage.removeItem(storageKey)
    onClose()
    setStep(1)
  }

  const updateGeneratedQuestion = (
    questionId: string,
    changes: Partial<Question>,
  ) => {
    setGeneratedList((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, ...changes } : question,
      ),
    )
  }

  const toggleQuestionCollapse = (questionId: string) => {
    setCollapsedQuestionIds((current) =>
      current.includes(questionId)
        ? current.filter((id) => id !== questionId)
        : [...current, questionId],
    )
  }

  const rejectGeneratedQuestion = (questionId: string) => {
    setGeneratedList((current) => {
      const next = current.filter((question) => question.id !== questionId)
      if (next.length === 0) {
        window.sessionStorage.removeItem(storageKey)
        setStep(1)
      }
      return next
    })
    setCollapsedQuestionIds((current) => current.filter((id) => id !== questionId))
    setExpandedTestCaseIds((current) => {
      const next = { ...current }
      delete next[questionId]
      return next
    })
  }

  const handleRejectAll = () => {
    setGeneratedList([])
    setCollapsedQuestionIds([])
    setExpandedTestCaseIds({})
    window.sessionStorage.removeItem(storageKey)
    toast.success('Đã từ chối tất cả câu hỏi nháp.')
    setStep(1)
  }

  const updateGeneratedTestCases = (
    questionId: string,
    testCases: NonNullable<Question['testCases']>,
  ) => {
    setGeneratedList((current) =>
      current.map((question) =>
        question.id === questionId ? { ...question, testCases } : question,
      ),
    )
  }

  const toggleTestCase = (questionId: string, testCaseId: string) => {
    setExpandedTestCaseIds((current) => {
      const ids = current[questionId] ?? []
      return {
        ...current,
        [questionId]: ids.includes(testCaseId)
          ? ids.filter((id) => id !== testCaseId)
          : [...ids, testCaseId],
      }
    })
  }

  const updateOptionContent = (
    questionId: string,
    optionId: string,
    content: string,
  ) => {
    setGeneratedList((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
            ...question,
            options: question.options?.map((option) =>
              option.id === optionId ? { ...option, content } : option,
            ),
          }
          : question,
      ),
    )
  }

  const updateCorrectOption = (
    questionId: string,
    optionId: string,
    checked: boolean,
  ) => {
    setGeneratedList((current) =>
      current.map((question) => {
        if (question.id !== questionId) return question
        return {
          ...question,
          options: question.options?.map((option) => {
            if (question.type === 'SINGLE_CHOICE' || question.type === 'TRUE_FALSE') {
              return { ...option, isCorrect: option.id === optionId }
            }
            return option.id === optionId ? { ...option, isCorrect: checked } : option
          }),
        }
      }),
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950">AI hỗ trợ thêm câu hỏi vào đề</h3>
              <p className="text-xs text-gray-500">Tạo câu hỏi nháp từ tài liệu hoặc bóc tách đề có sẵn.</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-5 py-4">
          {step === 1 && isGenerating && (
            <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 py-12 text-center">
              {/* AI Sparkles icon nhấp nhô & gợn sóng */}
              <div className="relative flex items-center justify-center">
                <span className="absolute h-16 w-16 rounded-full bg-blue-400/20 animate-ping opacity-75" style={{ animationDuration: '1.8s' }} />
                <span className="absolute h-10 w-10 rounded-full bg-blue-500/30 animate-ping opacity-90" style={{ animationDuration: '1.2s' }} />
                <div className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
                  <Sparkles size={24} className="text-amber-300 animate-bounce" style={{ animationDuration: '1s' }} />
                </div>
              </div>

              <p className="mt-4 text-sm font-bold text-gray-950">
                {aiMode === 'EXTRACT_EXISTING_EXAM' ? 'AI đang bóc tách câu hỏi...' : 'AI đang sinh câu hỏi...'}
              </p>
              <p className="max-w-xs text-xs text-gray-500">
                Đang phân tích tài liệu và cấu trúc câu hỏi, vui lòng đợi trong giây lát.
              </p>
            </div>
          )}

          {step === 1 && !isGenerating && (
            <div className="flex min-h-0 flex-1 flex-col">
              <div className="flex min-h-0 flex-1 flex-col space-y-4 overflow-y-auto pr-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900">Chọn nguồn câu hỏi</label>
                  <div className="grid grid-cols-2 gap-3">
                    <SourceButton
                      active={sourceMode === 'UPLOAD_FILE'}
                      title="Tải file mới"
                      description="Dùng đề cũ hoặc tài liệu riêng."
                      onClick={() => setSourceMode('UPLOAD_FILE')}
                    />
                    <SourceButton
                      active={sourceMode === 'COURSE_MATERIAL'}
                      title="Tài liệu lớp học"
                      description="Lấy file đã upload ở lớp học phần."
                      onClick={() => setSourceMode('COURSE_MATERIAL')}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {sourceMode === 'UPLOAD_FILE' ? (
                    <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/60">
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.webp"
                        multiple
                        className="hidden"
                        onChange={(event) => {
                          const files = Array.from(event.target.files ?? [])
                          if (files.length) setSourceFiles(files)
                          event.currentTarget.value = ''
                        }}
                      />
                      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-xs">
                        <Upload size={20} />
                      </div>
                      <p className="mt-2 text-xs font-bold text-gray-900">
                        Chọn file PDF, DOCX, TXT, PNG hoặc JPG
                      </p>
                    </label>
                  ) : (
                    <div className="max-h-52 space-y-2 overflow-y-auto pr-1">
                      {materialsLoading ? (
                        <div className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 p-5 text-xs text-gray-500">
                          <Loader2 size={15} className="animate-spin" />
                          Đang tải tài liệu...
                        </div>
                      ) : !subjectId ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
                          Hãy chọn môn học cho đề trước.
                        </div>
                      ) : materials.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-200 p-5 text-center text-xs text-gray-500">
                          Chưa có tài liệu được bật quyền AI trong các lớp học phần của môn này.
                        </div>
                      ) : materials.map((material) => {
                        const checked = selectedMaterialIds.includes(material.id)
                        return (
                          <label
                            key={material.id}
                            className={`relative flex min-h-16 cursor-pointer items-center gap-3 rounded-xl border p-3 pr-24 transition-colors ${checked ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                              }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) => toggleMaterial(material.id, event.target.checked)}
                              className="rounded text-blue-600 focus:ring-blue-500"
                            />
                            <FileText size={17} className="shrink-0 text-blue-600" />
                            <span className="min-w-0">
                              <span className="block truncate text-xs font-semibold text-gray-900">
                                {material.fileName}
                              </span>
                              <span className="block truncate text-xs text-gray-400">
                                {material.courseCode} · {formatFileSize(material.fileSize)}
                              </span>
                            </span>
                            {material.duplicated && (
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold leading-none text-amber-700">
                                Trùng nội dung
                              </span>
                            )}
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {sourceMode === 'UPLOAD_FILE' && (
                    <FileSelectionList
                      files={sourceFiles}
                      onRemove={removeSourceFile}
                      onClear={() => setSourceFiles([])}
                    />
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-900">Chọn chế độ xử lý</label>
                  <div className="grid grid-cols-2 gap-3">
                    <ModeButton
                      active={aiMode === 'EXTRACT_EXISTING_EXAM'}
                      icon={<FileText size={15} className="text-blue-600" />}
                      title="Bóc tách đề có sẵn"
                      description="Tách câu hỏi, đáp án và gợi ý phân loại."
                      onClick={() => setAiMode('EXTRACT_EXISTING_EXAM')}
                    />
                    <ModeButton
                      active={aiMode === 'GENERATE_FROM_MATERIAL'}
                      icon={<Sparkles size={15} className="text-indigo-600" />}
                      title="Sinh câu hỏi từ tài liệu"
                      description="Tạo câu hỏi mới bám sát kiến thức."
                      onClick={() => setAiMode('GENERATE_FROM_MATERIAL')}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">
                      {aiMode === 'GENERATE_FROM_MATERIAL' ? 'Số câu muốn sinh' : 'Số câu khi bóc tách'}
                    </label>
                    {aiMode === 'GENERATE_FROM_MATERIAL' ? (
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={questionCount}
                        onChange={(event) => {
                          const value = event.currentTarget.valueAsNumber
                          setQuestionCount(Number.isFinite(value) ? Math.min(50, Math.max(1, value)) : 1)
                        }}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold outline-none focus:border-blue-500"
                      />
                    ) : (
                      <input
                        disabled
                        value="Tự nhận diện theo nội dung đề"
                        className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs font-bold text-gray-600"
                      />
                    )}
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Cấu trúc câu hỏi đang soạn</label>
                    <input
                      disabled
                      value={examType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : examType === 'PROGRAMMING' ? 'Lập trình Code' : 'Hỗn hợp'}
                      className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs font-bold text-gray-600"
                    />
                  </div>
                </div>

                <div className="flex min-h-[210px] flex-1 flex-col">
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Yêu cầu bổ sung cho AI</label>
                  <textarea
                    rows={8}
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    spellCheck={false}
                    autoCorrect="off"
                    autoCapitalize="off"
                    placeholder="Ví dụ: tập trung vào mảng 2 chiều, tránh câu hỏi mẹo..."
                    className="min-h-[210px] flex-1 resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="mt-4 flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white pt-3">
                <button type="button" onClick={onClose} className="h-11 rounded-xl bg-gray-100 px-5 text-sm font-semibold text-gray-700">
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleStartGenerate}
                  className="flex h-11 items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-7 text-sm font-bold text-white shadow-xs transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                >
                  {isGenerating ? <RefreshCw size={15} className="animate-spin text-amber-300" /> : <Sparkles size={15} className="text-amber-300" />}
                  {isGenerating
                    ? 'AI đang xử lý...'
                    : aiMode === 'GENERATE_FROM_MATERIAL'
                      ? 'Sinh câu hỏi'
                      : 'Bóc tách câu hỏi'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex min-h-0 flex-1 flex-col gap-4">
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  AI đã {aiMode === 'EXTRACT_EXISTING_EXAM' ? 'bóc tách' : 'sinh'} {generatedList.length} câu hỏi nháp
                </span>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleRejectAll}
                    className="flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    <Trash2 size={13} />
                    Từ chối tất cả
                  </button>
                  <span className="text-gray-300">|</span>
                  <button onClick={() => setStep(1)} className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer">
                    Chọn chế độ khác
                  </button>
                </div>
              </div>

              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
                {generatedList.map((q, index) => {
                  const isCollapsed = collapsedQuestionIds.includes(q.id)
                  return (
                    <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-bold text-blue-700">Câu {index + 1}</span>
                            <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600">
                              {questionTypeLabel[q.type] || q.type}
                            </span>
                            <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${difficultyTone[q.difficulty]}`}>
                              {difficultyLabel[q.difficulty]}
                            </span>
                          </div>
                          {isCollapsed && (
                            <p className="mt-1.5 truncate text-sm font-semibold text-gray-950">
                              {q.title || q.content || 'Chưa có tiêu đề'}
                            </p>
                          )}
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => rejectGeneratedQuestion(q.id)}
                            className="flex items-center gap-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 transition-colors hover:bg-rose-100"
                          >
                            <XCircle size={14} />
                            Từ chối
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleQuestionCollapse(q.id)}
                            className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 cursor-pointer"
                            title={isCollapsed ? 'Mở câu hỏi' : 'Thu gọn câu hỏi'}
                          >
                            {isCollapsed ? <ChevronDown size={15} /> : <ChevronUp size={15} />}
                          </button>
                        </div>
                      </div>
                      {!isCollapsed && (
                        <>
                          {q.aiDifficultyReason && (
                            <p className="mb-3 text-xs leading-5 text-gray-500">
                              <span className="font-semibold text-gray-600">Lý do xếp độ khó:</span> {q.aiDifficultyReason}
                            </p>
                          )}
                          {q.type === 'PROGRAMMING' ? (
                            <div className="space-y-2">
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Tiêu đề bài</label>
                                <input
                                  value={q.title}
                                  onChange={(event) => updateGeneratedQuestion(q.id, { title: event.target.value })}
                                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm font-semibold text-gray-950 outline-none focus:border-blue-500"
                                />
                              </div>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Mô tả bài toán</label>
                                <RichTextEditor
                                  value={q.content}
                                  onChange={(val) => updateGeneratedQuestion(q.id, { content: val })}
                                  placeholder="Nhập mô tả bài toán..."
                                  minHeight={200}
                                  height={240}
                                />
                              </div>
                              <QuestionProgrammingEditor
                                programmingLanguage={q.programmingLanguage ?? 'JAVA'}
                                onLanguageChange={(value) => updateGeneratedQuestion(q.id, { programmingLanguage: value })}
                                timeLimitMs={q.timeLimitMs ?? 2000}
                                onTimeLimitChange={(value) => updateGeneratedQuestion(q.id, { timeLimitMs: value })}
                                memoryLimitMb={q.memoryLimitMb ?? 256}
                                onMemoryLimitChange={(value) => updateGeneratedQuestion(q.id, { memoryLimitMb: value })}
                                maxCodeSizeKb={q.maxCodeSizeKb ?? 256}
                                onMaxCodeSizeChange={(value) => updateGeneratedQuestion(q.id, { maxCodeSizeKb: value })}
                                testCases={q.testCases ?? []}
                                onTestCasesChange={(testCases) => updateGeneratedTestCases(q.id, testCases)}
                                expandedTcIds={expandedTestCaseIds[q.id] ?? []}
                                onToggleExpandTc={(testCaseId) => toggleTestCase(q.id, testCaseId)}
                              />
                            </div>
                          ) : (
                            <>
                              <div>
                                <label className="mb-1 block text-xs font-semibold text-gray-600">Câu hỏi</label>
                                <textarea
                                  rows={2}
                                  value={q.title}
                                  onChange={(event) => {
                                    const value = event.target.value
                                    updateGeneratedQuestion(q.id, { title: value, content: value })
                                  }}
                                  className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm font-semibold leading-6 text-gray-950 outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                {q.options?.map((opt, i) => (
                                  <label
                                    key={opt.id}
                                    className={`flex items-center gap-2 rounded-lg border p-2 text-xs ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50 font-semibold text-emerald-700' : 'border-gray-200 bg-gray-50 text-gray-700'}`}
                                  >
                                    <input
                                      type={q.type === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                                      name={`correct-${q.id}`}
                                      checked={opt.isCorrect}
                                      onChange={(event) =>
                                        updateCorrectOption(q.id, opt.id, event.target.checked)
                                      }
                                      className="shrink-0 text-emerald-600 focus:ring-emerald-500"
                                    />
                                    <span className="shrink-0 font-bold">{String.fromCharCode(65 + i)}.</span>
                                    <input
                                      value={opt.content}
                                      onChange={(event) =>
                                        updateOptionContent(q.id, opt.id, event.target.value)
                                      }
                                      className="min-w-0 flex-1 bg-transparent outline-none"
                                    />
                                    {opt.isCorrect && <Check size={14} className="shrink-0 text-emerald-600" />}
                                  </label>
                                ))}
                              </div>
                            </>
                          )}
                          <div className="mt-3">
                            <label className="mb-1 block text-xs font-semibold text-gray-600">Giải thích</label>
                            <textarea
                              rows={2}
                              value={q.explanation ?? ''}
                              onChange={(event) =>
                                updateGeneratedQuestion(q.id, { explanation: event.target.value })
                              }
                              className="w-full resize-y rounded-lg border border-blue-100 bg-blue-50 p-2 text-xs leading-5 text-blue-800 outline-none focus:border-blue-400"
                              placeholder="Nhập hoặc chỉnh giải thích đáp án..."
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )
                })}
              </div>

              <div className="flex shrink-0 justify-end gap-3 border-t border-gray-100 bg-white pt-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-200 cursor-pointer"
                >
                  Quay lại
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAddAll}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700 cursor-pointer"
                >
                  <Check size={15} />
                  Thêm vào đề ({generatedList.length})
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function SourceButton({ active, title, description, onClick }: { active: boolean; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-3 text-left transition-colors ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'}`}
    >
      <p className="text-xs font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </button>
  )
}

function ModeButton({ active, icon, title, description, onClick }: { active: boolean; icon: ReactNode; title: string; description: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`space-y-1 rounded-xl border-2 p-3 text-left transition-all ${active ? 'border-blue-600 bg-blue-50/60' : 'border-gray-100 bg-white hover:border-gray-200'}`}
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs font-bold text-gray-900">{icon} {title}</span>
        {active && <CheckCircle2 size={16} className="text-blue-600" />}
      </div>
      <p className="text-xs text-gray-500">{description}</p>
    </button>
  )
}
