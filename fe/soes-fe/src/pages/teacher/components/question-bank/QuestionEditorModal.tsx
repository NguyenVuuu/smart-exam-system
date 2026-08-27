import { X } from 'lucide-react'
import { useState } from 'react'
import type { ExamType } from '../../types/teacher-exam.types'
import type {
  Question,
  QuestionOption,
  QuestionType,
  TestCase,
} from '../../types/teacher-question-bank.types'
import { validateQuestion } from '../../utils/QuestionValidation'
import {
  MOCK_SUBJECTS,
  QuestionBasicFields,
} from './editor/QuestionBasicFields'
import { QuestionOptionsEditor } from './editor/QuestionOptionsEditor'
import { QuestionProgrammingEditor } from './editor/QuestionProgrammingEditor'

interface QuestionEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (question: Partial<Question>) => void
  initialQuestion?: Question | null
  examType?: ExamType
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
}: QuestionEditorModalProps) {
  const [subjectId, setSubjectId] = useState(initialQuestion?.subjectId || 'sub-01')
  const [questionType, setQuestionType] = useState<QuestionType>(() => {
    if (initialQuestion?.type) return initialQuestion.type
    if (examType === 'PROGRAMMING') return 'PROGRAMMING'
    return 'SINGLE_CHOICE'
  })
  const [content, setContent] = useState(initialQuestion?.content || '')
  const [explanation, setExplanation] = useState(initialQuestion?.explanation || '')
  const [difficulty, setDifficulty] = useState<Question['difficulty']>(initialQuestion?.difficulty || 'EASY')

  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options || [
      { id: 'opt-1', content: 'Phương án A', isCorrect: true },
      { id: 'opt-2', content: 'Phương án B', isCorrect: false },
      { id: 'opt-3', content: 'Phương án C', isCorrect: false },
      { id: 'opt-4', content: 'Phương án D', isCorrect: false },
    ],
  )

  const [programmingLanguage, setProgrammingLanguage] = useState<'JAVA' | 'C' | 'CPP'>(
    initialQuestion?.programmingLanguage || 'JAVA',
  )
  const [timeLimitMs, setTimeLimitMs] = useState(initialQuestion?.timeLimitMs || 2000)
  const [memoryLimitMb, setMemoryLimitMb] = useState(initialQuestion?.memoryLimitMb || 256)
  const [testCases, setTestCases] = useState<TestCase[]>(
    initialQuestion?.testCases || [
      { id: 'tc-1', input: '10', expectedOutput: '17', weight: 50, isHidden: false },
      { id: 'tc-2', input: '20', expectedOutput: '77', weight: 50, isHidden: true },
    ],
  )
  const [expandedTcIds, setExpandedTcIds] = useState<string[]>(['tc-1'])
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const selectedSubjectObj = MOCK_SUBJECTS.find((s) => s.id === subjectId) || MOCK_SUBJECTS[0]
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const payload: Partial<Question> = {
      type: questionType,
      difficulty,
      content,
      explanation,
      subjectId: selectedSubjectObj.id,
      subjectName: selectedSubjectObj.name,
      ...(questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE'
        ? { options }
        : {
            programmingLanguage,
            timeLimitMs,
            memoryLimitMb,
            testCases,
          }),
    }

    const errors = validateQuestion(payload)
    if (errors.length > 0) {
      setValidationErrors(errors)
      return
    }

    setValidationErrors([])
    onSave(payload)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full flex flex-col max-h-[85vh] shadow-xl animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 p-5 shrink-0 bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
              ?
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">
                {initialQuestion ? 'Chỉnh Sửa Câu Hỏi' : 'Tạo Câu Hỏi Mới Thủ Công'}
              </h3>
              <p className="text-xs text-gray-500">
                {examType ? `Đang khóa theo loại đề: ${examType}` : 'Quyền sở hữu thuộc về Giảng viên'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form id="question-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {validationErrors.length > 0 && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <p className="font-semibold">Cần kiểm tra lại câu hỏi:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          )}

          <QuestionBasicFields
            subjectId={subjectId}
            onSubjectChange={setSubjectId}
            questionType={questionType}
            onQuestionTypeChange={setQuestionType}
            difficulty={difficulty}
            onDifficultyChange={setDifficulty}
            content={content}
            onContentChange={setContent}
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
            className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
          >
            {initialQuestion ? 'Lưu Thay Đổi' : 'Thêm Câu Hỏi'}
          </button>
        </div>
      </div>
    </div>
  )
}
