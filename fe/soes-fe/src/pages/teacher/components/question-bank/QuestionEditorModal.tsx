import { ChevronDown, ChevronUp, Code, Eye, EyeOff, Plus, Trash2, X } from 'lucide-react'
import { useState } from 'react'
import AppSelect from '../../../../components/common/AppSelect'
import type { ExamType } from '../../types/teacher-exam.types'
import type {
  Question,
  QuestionOption,
  QuestionType,
  TestCase,
} from '../../types/teacher-question-bank.types'
import { validateQuestion } from '../../utils/QuestionValidation'

interface QuestionEditorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (question: Partial<Question>) => void
  initialQuestion?: Question | null
  examType?: ExamType
}

const MOCK_SUBJECTS = [
  { id: 'sub-01', name: 'Lập trình Java căn bản' },
  { id: 'sub-02', name: 'Cấu trúc dữ liệu và Giải thuật' },
  { id: 'sub-03', name: 'Lập trình C++' },
  { id: 'sub-04', name: 'Cơ sở dữ liệu' },
]

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
  const [difficulty, setDifficulty] = useState(initialQuestion?.difficulty || 'EASY')

  // Options for Single/Multiple choice
  const [options, setOptions] = useState<QuestionOption[]>(
    initialQuestion?.options || [
      { id: 'opt-1', content: 'Phương án A', isCorrect: true },
      { id: 'opt-2', content: 'Phương án B', isCorrect: false },
      { id: 'opt-3', content: 'Phương án C', isCorrect: false },
      { id: 'opt-4', content: 'Phương án D', isCorrect: false },
    ],
  )

  // Coding Question states
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

  // Option handlers
  const handleAddOption = () => {
    setOptions([
      ...options,
      { id: `opt-${Date.now()}`, content: `Phương án mới`, isCorrect: false },
    ])
  }

  const handleOptionChange = <K extends keyof QuestionOption>(
    id: string,
    field: K,
    val: QuestionOption[K],
  ) => {
    setOptions((prev) =>
      prev.map((opt) => {
        if (opt.id === id) {
          return { ...opt, [field]: val }
        }
        if (
          field === 'isCorrect' &&
          (questionType === 'SINGLE_CHOICE' || questionType === 'TRUE_FALSE') &&
          val === true
        ) {
          return { ...opt, isCorrect: false }
        }
        return opt
      }),
    )
  }

  const handleRemoveOption = (id: string) => {
    if (options.length <= 2) return
    setOptions(options.filter((o) => o.id !== id))
  }

  const handleQuestionTypeChange = (nextType: QuestionType) => {
    setQuestionType(nextType)
    if (nextType === 'TRUE_FALSE') {
      setOptions([
        { id: 'opt-true', content: 'Đúng', isCorrect: true },
        { id: 'opt-false', content: 'Sai', isCorrect: false },
      ])
    }
  }

  // TestCase handlers
  const handleAddTestCase = () => {
    const newId = `tc-${Date.now()}`
    setTestCases([
      ...testCases,
      { id: newId, input: '', expectedOutput: '', weight: 0, isHidden: true },
    ])
    setExpandedTcIds([...expandedTcIds, newId])
  }

  const handleTestCaseChange = <K extends keyof TestCase>(
    id: string,
    field: K,
    val: TestCase[K],
  ) => {
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === id ? { ...tc, [field]: val } : tc)),
    )
  }

  const handleRemoveTestCase = (id: string) => {
    setTestCases(testCases.filter((tc) => tc.id !== id))
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
        {/* Fixed Modal Header */}
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

        {/* Scrollable Form Body */}
        <form id="question-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
          {validationErrors.length > 0 && (
            <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              <p className="font-semibold">Cần kiểm tra lại câu hỏi:</p>
              <ul className="mt-1 list-disc space-y-0.5 pl-4">
                {validationErrors.map((error) => <li key={error}>{error}</li>)}
              </ul>
            </div>
          )}
          {/* Subject, Question Type & Difficulty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Môn Học</label>
              <AppSelect
                value={subjectId}
                onChange={setSubjectId}
                buttonClassName="bg-gray-50 text-blue-900"
                menuClassName="z-50"
                options={MOCK_SUBJECTS.map((subject) => ({
                  value: subject.id,
                  label: subject.name,
                }))}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Dạng Câu Hỏi</label>
              <AppSelect
                value={questionType}
                onChange={handleQuestionTypeChange}
                buttonClassName="bg-gray-50"
                menuClassName="z-50"
                options={questionTypeOptions}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Mức Độ Khó</label>
              <AppSelect
                value={difficulty}
                onChange={setDifficulty}
                buttonClassName="bg-gray-50"
                menuClassName="z-50"
                options={[
                  { value: 'EASY', label: 'Dễ (Easy)' },
                  { value: 'MEDIUM', label: 'Trung bình (Medium)' },
                  { value: 'HARD', label: 'Khó (Hard)' },
                ]}
              />
            </div>
          </div>

          {/* Question Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Nội Dung Câu Hỏi / Đề Bài
            </label>
            <textarea
              rows={3}
              required
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Nhập chi tiết nội dung câu hỏi..."
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* SINGLE / MULTIPLE CHOICE EDITING */}
          {(questionType === 'SINGLE_CHOICE' || questionType === 'MULTIPLE_CHOICE' || questionType === 'TRUE_FALSE') && (
            <div className="space-y-3 border-t border-gray-100 pt-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-900">
                  Danh Sách Phương Án Lựa Chọn & Đáp Án Đúng
                </label>
                <button
                  type="button"
                  onClick={handleAddOption}
                  disabled={questionType === 'TRUE_FALSE'}
                  className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline disabled:text-gray-400 disabled:no-underline disabled:cursor-not-allowed"
                >
                  <Plus size={14} /> Thêm phương án
                </button>
              </div>

              <div className="space-y-2">
                {options.map((opt, index) => (
                  <div key={opt.id} className="flex items-center gap-3">
                    <input
                      type={questionType === 'MULTIPLE_CHOICE' ? 'checkbox' : 'radio'}
                      name="correct_option"
                      checked={opt.isCorrect}
                      onChange={(e) => handleOptionChange(opt.id, 'isCorrect', e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500 shrink-0 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-gray-500 w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={opt.content}
                      onChange={(e) => handleOptionChange(opt.id, 'content', e.target.value)}
                      placeholder={`Nội dung phương án ${String.fromCharCode(65 + index)}`}
                      className="flex-1 bg-gray-50 border border-gray-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
                    />
                    {questionType !== 'TRUE_FALSE' && options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveOption(opt.id)}
                        className="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PROGRAMMING QUESTION EDITING (BR-21) WITH COLLAPSIBLE TESTCASES */}
          {questionType === 'PROGRAMMING' && (
            <div className="space-y-4 border-t border-gray-100 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Ngôn Ngữ Thực Thi
                  </label>
                  <AppSelect
                    value={programmingLanguage}
                    onChange={setProgrammingLanguage}
                    buttonClassName="bg-gray-50 rounded-xl p-2"
                    menuClassName="z-50"
                    options={[
                      { value: 'JAVA', label: 'Java (Console)' },
                      { value: 'C', label: 'C (Console)' },
                      { value: 'CPP', label: 'C++ (Console)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Giới Hạn Thời Gian (ms)
                  </label>
                  <input
                    type="number"
                    value={timeLimitMs}
                    onChange={(e) => setTimeLimitMs(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Giới Hạn Bộ Nhớ (MB)
                  </label>
                  <input
                    type="number"
                    value={memoryLimitMb}
                    onChange={(e) => setMemoryLimitMb(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2"
                  />
                </div>
              </div>

              {/* Collapsible Test Cases Section (BR-21) */}
              <p className="text-xs text-gray-500">
                {examType ? `Đang khóa theo loại đề: ${examType}` : 'Quyền sở hữu thuộc về Giảng viên'}
              </p>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Code size={15} className="text-blue-600" />
                    Quản Lý Bộ Kiểm Thử ({testCases.length} Test Cases)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddTestCase}
                    className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
                  >
                    <Plus size={14} /> Thêm Test Case
                  </button>
                </div>

                <div className="space-y-2">
                  {testCases.map((tc, index) => {
                    const isTcExpanded = expandedTcIds.includes(tc.id)
                    return (
                      <div key={tc.id} className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                        {/* Collapsible Header */}
                        <div className="flex items-center justify-between text-xs font-bold text-gray-700">
                          <div className="flex items-center gap-2">
                            <span>Test Case #{index + 1}</span>
                            {!isTcExpanded && (
                              <span className="text-xs text-gray-500 font-normal">
                                (Input: <code className="bg-white px-1 rounded border">{tc.input || 'rỗng'}</code> ➔ Output: <code className="bg-white px-1 rounded border">{tc.expectedOutput || 'rỗng'}</code>)
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <label
                              className={`px-2 py-0.5 text-xs font-bold rounded-lg border flex items-center gap-1 cursor-pointer transition-colors ${
                                tc.isHidden
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              }`}
                              title={tc.isHidden ? 'Đang ẩn với Sinh viên (Bấm để công khai)' : 'Đang công khai với Sinh viên (Bấm để ẩn)'}
                            >
                              <input
                                type="checkbox"
                                checked={tc.isHidden}
                                onChange={(e) => handleTestCaseChange(tc.id, 'isHidden', e.target.checked)}
                                className="hidden"
                              />
                              {tc.isHidden ? <EyeOff size={13} /> : <Eye size={13} />}
                              <span>{tc.isHidden ? 'Ẩn' : 'Hiện'}</span>
                            </label>

                            <button
                              type="button"
                              onClick={() => toggleExpandTc(tc.id)}
                              className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title={isTcExpanded ? 'Thu gọn chi tiết testcase' : 'Xem chi tiết testcase'}
                            >
                              {isTcExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRemoveTestCase(tc.id)}
                              className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Xóa testcase này"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Collapsible Body */}
                        {isTcExpanded && (
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs pt-2 border-t border-gray-200/60 animate-in fade-in duration-100">
                            <div>
                              <span className="text-xs font-semibold text-gray-600">Input (stdin):</span>
                              <textarea
                                rows={2}
                                value={tc.input}
                                onChange={(e) => handleTestCaseChange(tc.id, 'input', e.target.value)}
                                placeholder="Dữ liệu đầu vào..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono mt-0.5"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-600">Expected Output (stdout):</span>
                              <textarea
                                rows={2}
                                value={tc.expectedOutput}
                                onChange={(e) => handleTestCaseChange(tc.id, 'expectedOutput', e.target.value)}
                                placeholder="Kết quả mong đợi..."
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs font-mono mt-0.5"
                              />
                            </div>
                            <div>
                              <span className="text-xs font-semibold text-gray-600">Trọng số (%):</span>
                              <input
                                type="number"
                                min={1}
                                max={100}
                                value={tc.weight}
                                onChange={(e) => handleTestCaseChange(tc.id, 'weight', Number(e.target.value))}
                                className="w-full bg-white border border-gray-200 rounded-lg p-2 text-xs mt-0.5"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Lời Giải / Hướng Dẫn Chi Tiết
            </label>
            <input
              type="text"
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Giải thích lý do đáp án đúng..."
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>
        </form>

        {/* Fixed Sticky Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-100 shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-xs rounded-xl transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            form="question-form"
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
          >
            Lưu câu hỏi
          </button>
        </div>
      </div>
    </div>
  )
}
