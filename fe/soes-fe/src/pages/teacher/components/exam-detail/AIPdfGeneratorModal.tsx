import { Check, CheckCircle2, FileText, RefreshCw, Sparkles, Upload, X } from 'lucide-react'
import { useState } from 'react'
import type { ExamType } from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'

interface AIPdfGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onApprovedAdd: (generatedQuestions: Question[]) => void
  examType: ExamType
}

export default function AIPdfGeneratorModal({
  isOpen,
  onClose,
  onApprovedAdd,
  examType,
}: AIPdfGeneratorModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [sourceMode, setSourceMode] = useState<'UPLOAD_FILE' | 'COURSE_MATERIAL'>('UPLOAD_FILE')
  const [fileName, setFileName] = useState<string>('De_Thi_Mau_Lap_Trinh_Java.pdf')
  const [aiMode, setAiMode] = useState<'EXTRACT_EXISTING_EXAM' | 'GENERATE_FROM_MATERIAL'>('EXTRACT_EXISTING_EXAM')
  const [questionCount, setQuestionCount] = useState<number>(3)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)

  // AI Draft Questions State
  const [generatedList, setGeneratedList] = useState<Question[]>([])

  if (!isOpen) return null

  const handleStartGenerate = () => {
    if (examType === 'PROGRAMMING') {
      alert('MVP hiện tại chỉ hỗ trợ AI sinh/bóc tách câu hỏi trắc nghiệm. Câu lập trình nên do giảng viên tự soạn và tự cấu hình test case.')
      return
    }

    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStep(2)

      const objectiveQuestions: Question[] = [
        {
          id: `ai-gen-mc-${Date.now()}-1`,
          subjectId: 'sub-01',
          subjectName: 'Lập trình Java căn bản',
          teacherId: 'gv-01',
          teacherName: 'AI Generator',
          type: 'SINGLE_CHOICE',
          difficulty: 'EASY',
          title: aiMode === 'EXTRACT_EXISTING_EXAM' ? 'Từ khóa định nghĩa Interface' : 'Khởi chạy Thread trong Java',
          content:
            aiMode === 'EXTRACT_EXISTING_EXAM'
              ? '[Bóc tách từ PDF] Từ khóa nào trong Java được sử dụng để định nghĩa một Giao diện (Interface)?'
              : '[AI Sinh Mới từ Bài Giảng] Phương thức nào sau đây được dùng để bắt đầu một luồng (Thread) mới trong Java?',
          explanation: 'Phương thức start() được sử dụng để kích hoạt Thread chạy độc lập.',
          options: [
            { id: 'opt-1', content: 'run()', isCorrect: false },
            { id: 'opt-2', content: 'start()', isCorrect: true },
            { id: 'opt-3', content: 'execute()', isCorrect: false },
            { id: 'opt-4', content: 'init()', isCorrect: false },
          ],
          createdAt: 'AI Vừa xử lý',
        },
        {
          id: `ai-gen-mc-${Date.now()}-2`,
          subjectId: 'sub-01',
          subjectName: 'Lập trình Java căn bản',
          teacherId: 'gv-01',
          teacherName: 'AI Generator',
          type: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM',
          title: aiMode === 'EXTRACT_EXISTING_EXAM' ? 'Java Collections Framework' : 'Access Modifier trong Java',
          content:
            aiMode === 'EXTRACT_EXISTING_EXAM'
              ? '[Bóc tách từ PDF] Những collection nào sau đây thuộc về Java Collections Framework?'
              : '[AI Sinh Mới từ Bài Giảng] Những từ khóa truy cập (Access Modifier) nào sau đây hợp lệ trong ngôn ngữ Java?',
          explanation: 'public, private, protected là các Access Modifiers chuẩn trong Java.',
          options: [
            { id: 'opt-1', content: 'public', isCorrect: true },
            { id: 'opt-2', content: 'private', isCorrect: true },
            { id: 'opt-3', content: 'protected', isCorrect: true },
            { id: 'opt-4', content: 'internal', isCorrect: false },
          ],
          createdAt: 'AI Vừa xử lý',
        },
      ]

      const mixedQuestions: Question[] =
        examType === 'MIXED'
          ? [
              ...objectiveQuestions,
              {
                id: `ai-gen-code-${Date.now()}-1`,
                subjectId: 'sub-01',
                subjectName: 'Lập trình Java căn bản',
                teacherId: 'gv-01',
                teacherName: 'AI Generator',
                type: 'PROGRAMMING',
                difficulty: 'HARD',
                title: 'Tổng các số chẵn từ 1 đến n',
                content: '[AI Phân loại từ file] Viết chương trình Java nhập số nguyên n và in tổng các số chẵn từ 1 đến n.',
                explanation: 'Câu lập trình cần giảng viên rà soát test case trước khi dùng.',
                programmingLanguage: 'JAVA',
                timeLimitMs: 2000,
                memoryLimitMb: 256,
                testCases: [
                  { id: 'tc-ai-1', input: '10', expectedOutput: '30', isHidden: false },
                  { id: 'tc-ai-2', input: '20', expectedOutput: '110', isHidden: true },
                ],
                createdAt: 'AI Vừa xử lý',
              },
            ]
          : objectiveQuestions

      setGeneratedList(mixedQuestions)
    }, 1200)
  }

  const handleConfirmAddAll = () => {
    onApprovedAdd(generatedList)
    onClose()
    setStep(1)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/40 p-4 backdrop-blur-xs">
      <div className="flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-5 py-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-950">AI hỗ trợ thêm câu hỏi vào đề</h3>
              <p className="text-xs text-gray-500">
                Tạo câu hỏi nháp từ tài liệu hoặc bóc tách đề có sẵn để chèn vào đề đang soạn
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {/* STEP 1: UPLOAD FILE & CONFIG */}
          {step === 1 && (
            <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-900">Chọn nguồn câu hỏi</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSourceMode('UPLOAD_FILE')}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    sourceMode === 'UPLOAD_FILE'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Tải file mới</p>
                  <p className="mt-1 text-xs text-gray-500">Dùng đề cũ hoặc tài liệu riêng cho đề đang soạn.</p>
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('COURSE_MATERIAL')}
                  className={`rounded-xl border p-3 text-left transition-colors ${
                    sourceMode === 'COURSE_MATERIAL'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <p className="text-xs font-bold text-gray-900">Tài liệu lớp học</p>
                  <p className="mt-1 text-xs text-gray-500">Lấy file bài giảng đã upload ở lớp học phần.</p>
                </button>
              </div>
            </div>

            {/* Upload Area */}
            <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/60">
              {sourceMode === 'UPLOAD_FILE' && (
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0]
                    if (file) setFileName(file.name)
                  }}
                />
              )}
              <div className="w-10 h-10 bg-white rounded-xl text-blue-600 shadow-xs flex items-center justify-center mx-auto">
                {sourceMode === 'UPLOAD_FILE' ? <Upload size={20} /> : <FileText size={20} />}
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900">
                  {sourceMode === 'UPLOAD_FILE'
                    ? 'Kéo thả file PDF, DOCX, TXT, PNG hoặc JPG vào đây'
                    : 'Chọn tài liệu từ lớp học phần để AI đọc nội dung'}
                </p>
                <p className="text-xs text-gray-500">Đã chọn file: <span className="font-semibold text-blue-600">{fileName}</span> (2.4 MB)</p>
                <p className="text-xs text-gray-500">
                  AI chỉ tạo câu hỏi nháp, giảng viên cần duyệt trước khi chèn vào đề.
                </p>
              </div>
            </label>

            {/* AI Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-900">Chọn chế độ xử lý</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setAiMode('EXTRACT_EXISTING_EXAM')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                    aiMode === 'EXTRACT_EXISTING_EXAM'
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText size={15} className="text-blue-600" /> Bóc tách đề có sẵn
                    </span>
                    {aiMode === 'EXTRACT_EXISTING_EXAM' && <CheckCircle2 size={16} className="text-blue-600" />}
                  </div>
                  <p className="text-xs text-gray-500">
                    Dùng khi file đã là đề thi, AI tách câu hỏi, đáp án và gợi ý phân loại.
                  </p>
                </label>

                <label
                  onClick={() => setAiMode('GENERATE_FROM_MATERIAL')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                    aiMode === 'GENERATE_FROM_MATERIAL'
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" /> Sinh câu hỏi từ tài liệu
                    </span>
                    {aiMode === 'GENERATE_FROM_MATERIAL' && <CheckCircle2 size={16} className="text-blue-600" />}
                  </div>
                  <p className="text-xs text-gray-500">
                    Dùng khi file là bài giảng/tài liệu, AI tạo câu hỏi mới bám sát kiến thức.
                  </p>
                </label>
              </div>
            </div>

            {/* Configs */}
            <div className="grid grid-cols-2 gap-4">
              {aiMode === 'GENERATE_FROM_MATERIAL' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Số lượng câu muốn sinh</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Cách lấy số câu</label>
                  <input
                    type="text"
                    disabled
                    value="Tự nhận diện theo đề"
                    className="w-full bg-gray-100 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-gray-600 cursor-not-allowed"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Cấu Trúc Câu Hỏi Đang Soạn</label>
                <input
                  type="text"
                  disabled
                  value={examType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : examType === 'PROGRAMMING' ? 'Lập trình Code' : 'Hỗn hợp: phân loại theo từng phần'}
                  className="w-full bg-gray-100 border border-gray-200 text-xs rounded-xl p-2.5 font-bold text-gray-600 cursor-not-allowed"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Yêu cầu bổ sung cho AI</label>
              <textarea
                rows={4}
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: tập trung vào Mảng 2 chiều, tránh câu hỏi mẹo, giữ đúng kiến thức trong tài liệu..."
                className="min-h-24 w-full resize-y bg-gray-50 border border-gray-200 text-sm rounded-xl p-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl">
                Hủy
              </button>
              <button
                disabled={isGenerating}
                onClick={handleStartGenerate}
                className="px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={15} className="animate-spin text-amber-300" />
                    AI đang xử lý...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-amber-300" />
                    Bắt đầu xử lý
                  </>
                )}
              </button>
            </div>
            </div>
          )}

          {/* STEP 2: REVIEW AI GENERATED QUESTIONS */}
          {step === 2 && (
            <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-600" />
                AI đã {aiMode === 'EXTRACT_EXISTING_EXAM' ? 'bóc tách' : 'sinh'} {generatedList.length} câu hỏi nháp
              </span>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Chọn chế độ khác
              </button>
            </div>

            {/* Generated List */}
            <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {generatedList.map((q, idx) => (
                <div key={q.id} className="bg-white p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-900">
                      Câu AI #{idx + 1} ({q.type === 'PROGRAMMING' ? 'Lập trình' : q.type})
                    </span>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">AI Confidence: 96%</span>
                  </div>
                  <p className="font-semibold text-gray-800">{q.content}</p>

                  {q.options && (
                    <div className="grid grid-cols-2 gap-1.5 pt-1">
                      {q.options.map((opt, i) => (
                        <div
                          key={opt.id}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                            opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold' : 'bg-gray-50 border-gray-200 text-gray-600'
                          }`}
                        >
                          <span>{String.fromCharCode(65 + i)}. {opt.content}</span>
                          {opt.isCorrect && <Check size={14} className="text-emerald-600 shrink-0" />}
                        </div>
                      ))}
                    </div>
                  )}
                  {q.testCases && (
                    <p className="text-xs text-blue-700 bg-blue-50 border border-blue-100 rounded-lg p-2">
                      {q.testCases.length} test case • {q.programmingLanguage}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl">
                Quay lại
              </button>
              <button
                onClick={handleConfirmAddAll}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={15} /> Duyệt & chèn {generatedList.length} câu vào đề
              </button>
            </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
