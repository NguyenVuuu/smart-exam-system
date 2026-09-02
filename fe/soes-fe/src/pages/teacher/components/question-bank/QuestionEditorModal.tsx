import { HelpCircle, X } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import type { Editor as TinyMCEEditor } from 'tinymce'
import type { ExamType } from '../../types/teacher-exam.types'
import type {
  Question,
  QuestionOption,
  QuestionType,
  TestCase,
} from '../../types/teacher-question-bank.types'
import { validateQuestion } from '../../utils/QuestionValidation'
import { QuestionBasicFields } from './editor/QuestionBasicFields'
import { QuestionOptionsEditor } from './editor/QuestionOptionsEditor'
import { QuestionProgrammingEditor } from './editor/QuestionProgrammingEditor'
import { uploadImagesInHtml } from '../../api/teacher-questions.api'
import { getApiErrorMessage } from '../../../../api/errors'

interface QuestionEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (question: Partial<Question>) => void | Promise<void>
  initialQuestion?: Question | null
  examType?: ExamType
  subjects?: Array<{ id: string; name: string }>
}

export default function QuestionEditorModal(props: QuestionEditorModalProps) {
  if (!props.isOpen) return null
  return <QuestionEditorContent key={props.initialQuestion?.id ?? 'new-question'} {...props} />
}

function QuestionEditorContent({
  onClose,
  onSave,
  initialQuestion,
  examType,
  subjects = [],
}: QuestionEditorModalProps) {
  const effectiveSubjects = useMemo(() => {
    const list = [...subjects]
    if (initialQuestion?.subjectId && !list.some((s) => s.id === initialQuestion.subjectId)) {
      list.unshift({
        id: initialQuestion.subjectId,
        name: initialQuestion.subjectName || 'Môn học hiện tại',
      })
    }
    return list
  }, [subjects, initialQuestion])

  const [subjectId, setSubjectId] = useState(
    initialQuestion?.subjectId || effectiveSubjects[0]?.id || '',
  )
  const [questionType, setQuestionType] = useState<QuestionType>(() => {
    if (initialQuestion?.type) return initialQuestion.type
    if (examType === 'PROGRAMMING') return 'PROGRAMMING'
    return 'SINGLE_CHOICE'
  })
  const [title, setTitle] = useState(initialQuestion?.title || '')
  const [content, setContent] = useState(initialQuestion?.content || '')
  const contentEditorRef = useRef<TinyMCEEditor | null>(null)
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '')
  const [difficulty, setDifficulty] = useState<Question['difficulty']>(initialQuestion?.difficulty || 'EASY')

  const [options, setOptions] = useState<QuestionOption[]>(() => {
    if (initialQuestion?.options?.length) return initialQuestion.options
    if (questionType === 'TRUE_FALSE') {
      return [
        { id: 'opt-true', content: 'Đúng', isCorrect: true },
        { id: 'opt-false', content: 'Sai', isCorrect: false },
      ]
    }
    return [
      { id: 'opt-1', content: 'Phương án A', isCorrect: true },
      { id: 'opt-2', content: 'Phương án B', isCorrect: false },
      { id: 'opt-3', content: 'Phương án C', isCorrect: false },
      { id: 'opt-4', content: 'Phương án D', isCorrect: false },
    ]
  })

  const handleQuestionTypeChange = (newType: QuestionType) => {
    setQuestionType(newType)
    if (newType === 'TRUE_FALSE') {
      setOptions((prev) => {
        const isCurrentlyFalse = prev.find((opt) => opt.isCorrect)?.content === 'Sai'
        return [
          { id: 'opt-true', content: 'Đúng', isCorrect: !isCurrentlyFalse },
          { id: 'opt-false', content: 'Sai', isCorrect: isCurrentlyFalse },
        ]
      })
    } else if (questionType === 'TRUE_FALSE' && (newType === 'SINGLE_CHOICE' || newType === 'MULTIPLE_CHOICE')) {
      setOptions([
        { id: 'opt-1', content: 'Phương án A', isCorrect: true },
        { id: 'opt-2', content: 'Phương án B', isCorrect: false },
        { id: 'opt-3', content: 'Phương án C', isCorrect: false },
        { id: 'opt-4', content: 'Phương án D', isCorrect: false },
      ])
    }
  }

  const [programmingLanguage, setProgrammingLanguage] = useState<'JAVA' | 'C' | 'CPP'>(
    initialQuestion?.programmingLanguage || 'JAVA',
  )
  const [timeLimitMs, setTimeLimitMs] = useState(initialQuestion?.timeLimitMs || 2000)
  const [memoryLimitMb, setMemoryLimitMb] = useState(initialQuestion?.memoryLimitMb || 256)
  const [maxCodeSizeKb, setMaxCodeSizeKb] = useState(initialQuestion?.maxCodeSizeKb || 256)
  const [testCases, setTestCases] = useState<TestCase[]>(
    initialQuestion?.testCases || [
      { id: 'tc-1', input: '10', expectedOutput: '17', isHidden: false },
      { id: 'tc-2', input: '20', expectedOutput: '77', isHidden: true },
    ],
  )
  const [expandedTcIds, setExpandedTcIds] = useState<string[]>(['tc-1'])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  const selectedSubjectObj =
    effectiveSubjects.find((subject) => subject.id === subjectId) || {
      id: subjectId,
      name: initialQuestion?.subjectName || '',
    }
  const questionTypeOptions = [
    ...(examType !== 'PROGRAMMING'
      ? [
          { value: 'SINGLE_CHOICE' as QuestionType, label: 'Trắc nghiệm 1 đáp án' },
          { value: 'MULTIPLE_CHOICE' as QuestionType, label: 'Trắc nghiệm nhiều đáp án' },
          { value: 'TRUE_FALSE' as QuestionType, label: 'Đúng / Sai' },
        ]
      : []),
    ...(examType !== 'MULTIPLE_CHOICE'
      ? [{ value: 'PROGRAMMING' as QuestionType, label: 'Bài thi Lập trình (Console)' }]
      : []),
  ]

  const toggleExpandTc = (id: string) => {
    if (expandedTcIds.includes(id)) {
      setExpandedTcIds(expandedTcIds.filter((item) => item !== id))
    } else {
      setExpandedTcIds([...expandedTcIds, id])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (questionType === 'PROGRAMMING') {
      await contentEditorRef.current?.uploadImages()
    }
    const normalizedTitle = title.trim()
    const editorContent = contentEditorRef.current?.getContent() ?? content
    const normalizedContent = questionType === 'PROGRAMMING' ? editorContent.trim() : normalizedTitle
    const payload: Partial<Question> = {
      type: questionType,
      difficulty,
      title: normalizedTitle,
      content: normalizedContent,
      explanation,
      subjectId: selectedSubjectObj?.id,
      subjectName: selectedSubjectObj?.name,
      ...(questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE'
        ? { options }
        : {
            programmingLanguage,
            timeLimitMs,
            memoryLimitMb,
            maxCodeSizeKb,
            testCases,
          }),
    }

    const errors = validateQuestion(payload)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    if (!selectedSubjectObj) {
      setValidationErrors(['Vui lòng chọn môn học.'])
      return
    }
    setValidationErrors([])
    setSaving(true)
    try {
      const finalContent = questionType === 'PROGRAMMING'
        ? await uploadImagesInHtml(normalizedContent)
        : normalizedContent

      await onSave({ ...payload, content: finalContent })
      onClose()
    } catch (err: unknown) {
      setValidationErrors([
        getApiErrorMessage(err, 'Không thể lưu câu hỏi. Dữ liệu đã nhập vẫn được giữ để bạn kiểm tra lại.'),
      ])
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 font-sans animate-in fade-in duration-200">
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
        <div className="shrink-0 px-6 py-5 border-b border-gray-100 flex items-start justify-between gap-4 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <HelpCircle size={21} />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-semibold text-gray-950">
                {initialQuestion ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
              </h2>
              <p className="mt-1 truncate text-[13px] leading-[19px] text-slate-500">
                {examType
                  ? `Đang áp dụng cấu hình theo loại đề: ${examType}`
                  : initialQuestion
                  ? 'Chỉnh sửa nội dung và cấu hình câu hỏi trong ngân hàng'
                  : 'Soạn thảo nội dung và thiết lập đáp án cho câu hỏi'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form id="question-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {validationErrors.length > 0 && (
            <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
              <p className="font-semibold">Cần kiểm tra lại câu hỏi:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <QuestionBasicFields
            subjects={effectiveSubjects}
            subjectId={subjectId}
            onSubjectChange={setSubjectId}
            questionType={questionType}
            onQuestionTypeChange={handleQuestionTypeChange}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            title={title}
            onTitleChange={setTitle}
            content={content}
            onContentChange={setContent}
            onContentEditorInit={(editor) => { contentEditorRef.current = editor }}
            questionTypeOptions={questionTypeOptions}
          />

          {questionType !== 'PROGRAMMING' ? (
            <QuestionOptionsEditor
              questionType={questionType}
              options={options}
              onOptionsChange={setOptions}
            />
          ) : (
            <QuestionProgrammingEditor
              programmingLanguage={programmingLanguage}
              onLanguageChange={setProgrammingLanguage}
              timeLimitMs={timeLimitMs}
              onTimeLimitChange={setTimeLimitMs}
              memoryLimitMb={memoryLimitMb}
              onMemoryLimitChange={setMemoryLimitMb}
              maxCodeSizeKb={maxCodeSizeKb}
              onMaxCodeSizeChange={setMaxCodeSizeKb}
              testCases={testCases}
              onTestCasesChange={setTestCases}
              expandedTcIds={expandedTcIds}
              onToggleExpandTc={toggleExpandTc}
            />
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Giải Thích Đáp Án (Tùy Chọn)
            </label>
            <textarea
              rows={2}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Hiển thị cho sinh viên khi xem lại bài kiểm tra..."
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-gray-800"
            />
          </div>
        </form>

        <div className="flex items-center justify-end gap-2 border-t border-gray-100 p-4 shrink-0 bg-gray-50/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Hủy Bỏ
          </button>
          <button
            type="submit"
            form="question-form"
            disabled={saving}
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Đang lưu...' : initialQuestion ? 'Lưu Thay Đổi' : 'Thêm Câu Hỏi'}
          </button>
        </div>
      </div>
    </div>
  )
}
