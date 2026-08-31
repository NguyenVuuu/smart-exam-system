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
  const [fileName] = useState<string>('De_Thi_Mau_Lap_Trinh_Java.pdf')
  const [aiMode, setAiMode] = useState<'EXTRACT' | 'GENERATE_NEW'>('EXTRACT')
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
          title: aiMode === 'EXTRACT' ? 'Từ khóa định nghĩa Interface' : 'Khởi chạy Thread trong Java',
          content:
            aiMode === 'EXTRACT'
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
          title: aiMode === 'EXTRACT' ? 'Java Collections Framework' : 'Access Modifier trong Java',
          content:
            aiMode === 'EXTRACT'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={18} className="text-amber-300" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">AI Sinh & Bóc Tách Câu Hỏi Từ File PDF/Word</h3>
              <p className="text-xs text-gray-500">
                Tự động trích xuất đề thi cũ hoặc biên soạn câu hỏi mới từ tài liệu bài giảng
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* STEP 1: UPLOAD FILE & CONFIG */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Upload Area */}
            <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/30 rounded-2xl p-5 text-center space-y-2 transition-colors cursor-pointer">
              <div className="w-10 h-10 bg-white rounded-xl text-blue-600 shadow-xs flex items-center justify-center mx-auto">
                <Upload size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-gray-900">Kéo thả file PDF, DOCX đề thi mẫu hoặc Bài giảng vào đây</p>
                <p className="text-xs text-gray-500">Đã chọn file: <span className="font-semibold text-blue-600">{fileName}</span> (2.4 MB)</p>
                <p className="text-xs text-gray-500">
                  Với đề hỗn hợp, AI có thể bóc tách/gợi ý câu trắc nghiệm và câu lập trình để đưa vào đúng phần thi.
                </p>
              </div>
            </div>

            {/* AI Mode Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-900">Chọn Chế Độ Xử Lý Của AI</label>
              <div className="grid grid-cols-2 gap-3">
                <label
                  onClick={() => setAiMode('EXTRACT')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                    aiMode === 'EXTRACT'
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <FileText size={15} className="text-blue-600" /> 1. Bóc Tách Nguyên Văn
                    </span>
                    {aiMode === 'EXTRACT' && <CheckCircle2 size={16} className="text-blue-600" />}
                  </div>
                  <p className="text-xs text-gray-500">
                    Đọc file đề thi PDF cũ ➔ Bóc tách thành các câu hỏi A, B, C, D & đáp án đúng vào hệ thống.
                  </p>
                </label>

                <label
                  onClick={() => setAiMode('GENERATE_NEW')}
                  className={`p-3 rounded-xl border-2 transition-all cursor-pointer space-y-1 ${
                    aiMode === 'GENERATE_NEW'
                      ? 'border-blue-600 bg-blue-50/60'
                      : 'border-gray-100 hover:border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <Sparkles size={15} className="text-indigo-600" /> 2. Sinh Câu Hỏi Mới
                    </span>
                    {aiMode === 'GENERATE_NEW' && <CheckCircle2 size={16} className="text-blue-600" />}
                  </div>
                  <p className="text-xs text-gray-500">
                    Đọc tài liệu/slide bài giảng ➔ AI tự sáng tác bộ câu hỏi hoàn toàn mới bám sát kiến thức.
                  </p>
                </label>
              </div>
            </div>

            {/* Configs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số Lượng Câu Hỏi Mong Muốn</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 font-bold"
                />
              </div>

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
              <label className="block text-xs font-semibold text-gray-700 mb-1">Prompt Yêu Cầu Bổ Sung Cho AI (Tùy chọn)</label>
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Ví dụ: Tập trung vào nội dung Mảng 2 chiều và Kế thừa OOP..."
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
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
                    AI Đang Xử Lý File PDF...
                  </>
                ) : (
                  <>
                    <Sparkles size={15} className="text-amber-300" />
                    Bắt Đầu Cho AI Xử Lý
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
                AI Đã {aiMode === 'EXTRACT' ? 'Bóc Tách' : 'Sinh Mới'} Thành Công {generatedList.length} Câu Hỏi!
              </span>
              <button
                onClick={() => setStep(1)}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                ← Chọn chế độ khác
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
                <CheckCircle2 size={15} /> Duyệt & Chèn {generatedList.length} câu vào Đề Thi
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
