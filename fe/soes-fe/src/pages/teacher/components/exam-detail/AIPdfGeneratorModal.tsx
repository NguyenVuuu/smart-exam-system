import { Check, CheckCircle2, FileText, RefreshCw, Sparkles, Upload, X } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import FileSelectionList from '../FileSelectionList'
import { uploadAiSourceFiles } from '../../api/teacher-questions.api'
import type { ExamType } from '../../types/teacher-exam.types'
import type { Question } from '../../types/teacher-question-bank.types'

interface AIPdfGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onApprovedAdd: (generatedQuestions: Question[]) => void
  examType: ExamType
  subjectId: string
}

export default function AIPdfGeneratorModal({
  isOpen,
  onClose,
  onApprovedAdd,
  examType,
  subjectId,
}: AIPdfGeneratorModalProps) {
  const [step, setStep] = useState<1 | 2>(1)
  const [sourceMode, setSourceMode] = useState<'UPLOAD_FILE' | 'COURSE_MATERIAL'>('UPLOAD_FILE')
  const [sourceFiles, setSourceFiles] = useState<File[]>([])
  const [aiMode, setAiMode] = useState<'EXTRACT_EXISTING_EXAM' | 'GENERATE_FROM_MATERIAL'>('EXTRACT_EXISTING_EXAM')
  const [questionCount, setQuestionCount] = useState<number>(3)
  const [customPrompt, setCustomPrompt] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState<boolean>(false)
  const [generatedList, setGeneratedList] = useState<Question[]>([])

  if (!isOpen) return null

  const removeSourceFile = (index: number) => {
    setSourceFiles((current) => current.filter((_, currentIndex) => currentIndex !== index))
  }

  const handleStartGenerate = async () => {
    if (examType === 'PROGRAMMING') {
      toast.error('MVP hiện tại chỉ hỗ trợ AI sinh/bóc tách câu hỏi trắc nghiệm.')
      return
    }
    if (sourceMode === 'UPLOAD_FILE' && sourceFiles.length === 0) {
      toast.error('Vui lòng chọn file để AI xử lý.')
      return
    }
    if (sourceMode === 'UPLOAD_FILE' && !subjectId) {
      toast.error('Vui lòng chọn môn học cho đề trước khi dùng AI.')
      return
    }

    setIsGenerating(true)
    try {
      if (sourceMode === 'UPLOAD_FILE') await uploadAiSourceFiles(subjectId, sourceFiles)
      await new Promise((resolve) => setTimeout(resolve, 1200))
      setStep(2)

      const objectiveQuestions: Question[] = [
        {
          id: `ai-gen-mc-${Date.now()}-1`,
          subjectId: subjectId || 'sub-01',
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
          createdAt: 'AI vừa xử lý',
        },
        {
          id: `ai-gen-mc-${Date.now()}-2`,
          subjectId: subjectId || 'sub-01',
          subjectName: 'Lập trình Java căn bản',
          teacherId: 'gv-01',
          teacherName: 'AI Generator',
          type: 'MULTIPLE_CHOICE',
          difficulty: 'MEDIUM',
          title: aiMode === 'EXTRACT_EXISTING_EXAM' ? 'Java Collections Framework' : 'Access Modifier trong Java',
          content:
            aiMode === 'EXTRACT_EXISTING_EXAM'
              ? '[Bóc tách từ PDF] Những collection nào sau đây thuộc về Java Collections Framework?'
              : '[AI Sinh Mới từ Bài Giảng] Những từ khóa truy cập nào sau đây hợp lệ trong ngôn ngữ Java?',
          explanation: 'public, private, protected là các access modifier chuẩn trong Java.',
          options: [
            { id: 'opt-1', content: 'public', isCorrect: true },
            { id: 'opt-2', content: 'private', isCorrect: true },
            { id: 'opt-3', content: 'protected', isCorrect: true },
            { id: 'opt-4', content: 'internal', isCorrect: false },
          ],
          createdAt: 'AI vừa xử lý',
        },
      ]

      const mixedQuestions: Question[] =
        examType === 'MIXED'
          ? [
              ...objectiveQuestions,
              {
                id: `ai-gen-code-${Date.now()}-1`,
                subjectId: subjectId || 'sub-01',
                subjectName: 'Lập trình Java căn bản',
                teacherId: 'gv-01',
                teacherName: 'AI Generator',
                type: 'PROGRAMMING',
                difficulty: 'HARD',
                title: 'Tổng các số chẵn từ 1 đến n',
                content: '[AI phân loại từ file] Viết chương trình Java nhập số nguyên n và in tổng các số chẵn từ 1 đến n.',
                explanation: 'Câu lập trình cần giảng viên rà soát test case trước khi dùng.',
                programmingLanguage: 'JAVA',
                timeLimitMs: 2000,
                memoryLimitMb: 256,
                testCases: [
                  { id: 'tc-ai-1', input: '10', expectedOutput: '30', isHidden: false },
                  { id: 'tc-ai-2', input: '20', expectedOutput: '110', isHidden: true },
                ],
                createdAt: 'AI vừa xử lý',
              },
            ]
          : objectiveQuestions

      setGeneratedList(mixedQuestions)
    } catch {
      toast.error('Không thể tải file nguồn AI lên Supabase. Vui lòng kiểm tra cấu hình và thử lại.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleConfirmAddAll = () => {
    onApprovedAdd(generatedList)
    onClose()
    setStep(1)
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

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {step === 1 && (
            <div className="space-y-4">
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
                <label className="block cursor-pointer rounded-2xl border-2 border-dashed border-blue-200 bg-blue-50/30 p-5 text-center transition-colors hover:border-blue-400 hover:bg-blue-50/60">
                  {sourceMode === 'UPLOAD_FILE' && (
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                      multiple
                      className="hidden"
                      onChange={(event) => {
                        const files = Array.from(event.target.files ?? [])
                        if (files.length) setSourceFiles(files)
                        event.currentTarget.value = ''
                      }}
                    />
                  )}
                  <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-xs">
                    {sourceMode === 'UPLOAD_FILE' ? <Upload size={20} /> : <FileText size={20} />}
                  </div>
                  <p className="mt-2 text-xs font-bold text-gray-900">
                    {sourceMode === 'UPLOAD_FILE'
                      ? 'Chọn file PDF, DOCX, TXT, PNG hoặc JPG'
                      : 'Chọn tài liệu từ lớp học phần để AI đọc nội dung'}
                  </p>
                  {sourceMode === 'COURSE_MATERIAL' && (
                    <p className="mt-1 text-xs text-gray-500">Tài liệu lớp học sẽ được lọc theo môn của đề.</p>
                  )}
                </label>
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
                {aiMode === 'GENERATE_FROM_MATERIAL' ? (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Số lượng câu muốn sinh</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={questionCount}
                      onChange={(e) => setQuestionCount(Number(e.target.value))}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 p-2.5 text-xs font-bold"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-gray-700">Cách lấy số câu</label>
                    <input
                      disabled
                      value="Tự nhận diện theo đề"
                      className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs font-bold text-gray-600"
                    />
                  </div>
                )}

                <div>
                  <label className="mb-1 block text-xs font-semibold text-gray-700">Cấu trúc câu hỏi đang soạn</label>
                  <input
                    disabled
                    value={examType === 'MULTIPLE_CHOICE' ? 'Trắc nghiệm' : examType === 'PROGRAMMING' ? 'Lập trình Code' : 'Hỗn hợp'}
                    className="w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-100 p-2.5 text-xs font-bold text-gray-600"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-700">Yêu cầu bổ sung cho AI</label>
                <textarea
                  rows={4}
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  placeholder="Ví dụ: tập trung vào mảng 2 chiều, tránh câu hỏi mẹo..."
                  className="min-h-24 w-full resize-y rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                <button type="button" onClick={onClose} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700">
                  Hủy
                </button>
                <button
                  type="button"
                  disabled={isGenerating}
                  onClick={handleStartGenerate}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white shadow-xs transition-all hover:from-blue-700 hover:to-indigo-700 disabled:opacity-60"
                >
                  {isGenerating ? <RefreshCw size={15} className="animate-spin text-amber-300" /> : <Sparkles size={15} className="text-amber-300" />}
                  {isGenerating ? 'AI đang xử lý...' : 'Bắt đầu xử lý'}
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  AI đã {aiMode === 'EXTRACT_EXISTING_EXAM' ? 'bóc tách' : 'sinh'} {generatedList.length} câu hỏi nháp
                </span>
                <button onClick={() => setStep(1)} className="text-xs font-semibold text-blue-600 hover:underline">
                  Chọn chế độ khác
                </button>
              </div>

              <div className="space-y-3">
                {generatedList.map((q, index) => (
                  <div key={q.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-700">Câu {index + 1}</span>
                      <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold text-gray-600">{q.type}</span>
                    </div>
                    <h4 className="mb-2 text-sm font-bold text-gray-900">{q.title}</h4>
                    <p className="text-sm font-semibold text-gray-800">{q.content}</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                      {q.options?.map((opt, i) => (
                        <div
                          key={opt.id}
                          className={`rounded-lg border p-2 text-xs ${opt.isCorrect ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-100 bg-gray-50'}`}
                        >
                          <span>{String.fromCharCode(65 + i)}. {opt.content}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-3 border-t border-gray-100 pt-3">
                <button onClick={() => setStep(1)} className="rounded-xl bg-gray-100 px-4 py-2 text-xs font-medium text-gray-700">
                  Quay lại
                </button>
                <button
                  onClick={handleConfirmAddAll}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700"
                >
                  <Check size={15} />
                  Thêm vào đề
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
