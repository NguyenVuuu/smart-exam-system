import { Check, CheckCircle2, ChevronRight, FileText, Loader2, Sparkles, X, XCircle } from 'lucide-react'
import { useState } from 'react'
import AppSelect from '../../../../components/common/AppSelect'
import { MOCK_COURSE_MATERIALS } from '../../mock/teacher-course.mock'
import { MOCK_AI_DRAFT_QUESTIONS } from '../../mock/teacher-question-bank.mock'
import type { AIDraftQuestion } from '../../types/teacher-question-bank.types'

interface AIQuestionGeneratorModalProps {
  isOpen: boolean
  onClose: () => void
  onApprovedSave: (questions: AIDraftQuestion[]) => void
}

export default function AIQuestionGeneratorModal({
  isOpen,
  onClose,
  onApprovedSave,
}: AIQuestionGeneratorModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([
    'Chuong_1_Tong_Quan_Java.pdf',
    'Chuong_2_Huong_Doi_Tuong_OOP.pdf',
  ])
  const [promptInput, setPromptInput] = useState(
    'Sinh 5 câu trắc nghiệm Java OOP nâng cao tập trung vào tính đóng gói và kế thừa',
  )
  const [aiModel, setAiModel] = useState('Gemini 3.6 Flash')
  const [questionCount, setQuestionCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)

  // Draft questions list for Step 3 review (BR-12A)
  const [draftQuestions, setDraftQuestions] = useState<AIDraftQuestion[]>(MOCK_AI_DRAFT_QUESTIONS)

  if (!isOpen) return null

  const handleStartAIGeneration = () => {
    setIsGenerating(true)
    setTimeout(() => {
      setIsGenerating(false)
      setStep(3)
    }, 1500)
  }

  const handleUpdateDraftStatus = (id: string, newStatus: 'APPROVED' | 'REJECTED') => {
    setDraftQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: newStatus } : q)),
    )
  }

  const handleFinishReview = () => {
    const approvedList = draftQuestions.filter((q) => q.status === 'APPROVED')
    onApprovedSave(approvedList)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 space-y-5 shadow-xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900">AI Sinh Câu Hỏi Từ Tài Liệu (Gemini API)</h3>
              <p className="text-[11px] text-gray-500">Giảng viên là người đưa ra quyết định duyệt cuối cùng</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Step Progress */}
        <div className="flex items-center justify-center gap-6 py-2 bg-gray-50 rounded-xl text-xs">
          <span className={`font-semibold flex items-center gap-1.5 ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">1</span>
            Chọn tài liệu
          </span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className={`font-semibold flex items-center gap-1.5 ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">2</span>
            Cấu hình AI
          </span>
          <ChevronRight size={14} className="text-gray-400" />
          <span className={`font-semibold flex items-center gap-1.5 ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px]">3</span>
            Duyệt nháp
          </span>
        </div>

        {/* STEP 1: SELECT MATERIALS (BR-10) */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Bước 1: Chọn các tài liệu học tập được phép quét</h4>
              <p className="text-[11px] text-gray-500">Chỉ những tài liệu được đánh dấu mới được gửi sang Gemini AI để xử lý.</p>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {MOCK_COURSE_MATERIALS.map((mat) => {
                const isSelected = selectedMaterials.includes(mat.fileName)
                return (
                  <label
                    key={mat.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                      isSelected ? 'bg-blue-50/70 border-blue-200' : 'bg-white border-gray-200/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMaterials([...selectedMaterials, mat.fileName])
                          } else {
                            setSelectedMaterials(selectedMaterials.filter((m) => m !== mat.fileName))
                          }
                        }}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <FileText size={16} className="text-blue-600" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{mat.fileName}</p>
                        <p className="text-[10px] text-gray-400">{mat.fileSize} • {mat.fileType}</p>
                      </div>
                    </div>
                  </label>
                )
              })}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onClose} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl">Hủy</button>
              <button
                disabled={selectedMaterials.length === 0}
                onClick={() => setStep(2)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-semibold rounded-xl shadow-xs"
              >
                Tiếp tục cấu hình AI
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: GENERATOR CONFIG */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-gray-900">Bước 2: Cấu hình tham số Prompt & Model AI</h4>
              <p className="text-[11px] text-gray-500">AI chỉ sinh các câu hỏi Trắc nghiệm 1 & nhiều đáp án (BR-12A).</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Mô Hình AI</label>
                <AppSelect
                  value={aiModel}
                  onChange={setAiModel}
                  buttonClassName="bg-gray-50"
                  menuClassName="z-50"
                  options={[
                    { value: 'Gemini 3.6 Flash', label: 'Gemini 3.6 Flash (Tốc độ cao)' },
                    { value: 'Gemini 1.5 Pro', label: 'Gemini 1.5 Pro (Phân tích sâu)' },
                  ]}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Số Lượng Câu Trắc Nghiệm</label>
                <input
                  type="number"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Prompt Hướng Dẫn AI (Yêu cầu bổ sung)</label>
              <textarea
                rows={3}
                value={promptInput}
                onChange={(e) => setPromptInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-3 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex justify-between items-center pt-2">
              <button onClick={() => setStep(1)} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-medium rounded-xl">Quay lại</button>
              <button
                disabled={isGenerating}
                onClick={handleStartAIGeneration}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Đang gửi request tới Gemini AI...
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Bắt Đầu AI Sinh Câu Hỏi
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW DRAFT QUESTIONS (PENDING_REVIEW - BR-12A) */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-gray-900">Bước 3: Màn Hình Duyệt Câu Hỏi Nháp (PENDING_REVIEW - BR-12A)</h4>
                <p className="text-[11px] text-gray-500">Vui lòng đánh giá từng câu do AI sinh ra trước khi lưu vào ngân hàng.</p>
              </div>
              <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1 rounded-lg">
                Đã duyệt Approved: {draftQuestions.filter((q) => q.status === 'APPROVED').length} / {draftQuestions.length} câu
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto border border-gray-100 rounded-xl p-3 bg-gray-50/50">
              {draftQuestions.map((q, idx) => (
                <div key={q.id} className="p-4 bg-white border border-gray-200 rounded-xl space-y-3 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900">Câu nháp #{idx + 1} • {q.type === 'SINGLE_CHOICE' ? '1 Đáp án' : 'Nhiều đáp án'}</span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md ${
                        q.status === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-700'
                          : q.status === 'REJECTED'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <p className="text-xs text-gray-800 font-medium">{q.content}</p>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {q.options?.map((opt) => (
                      <div
                        key={opt.id}
                        className={`p-2 rounded-lg border text-[11px] flex items-center justify-between ${
                          opt.isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800 font-semibold' : 'bg-gray-50 border-gray-200 text-gray-700'
                        }`}
                      >
                        <span>{opt.content}</span>
                        {opt.isCorrect && <Check size={14} className="text-emerald-600 shrink-0" />}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                    <span className="text-[10px] text-gray-400">Nguồn tài liệu: {q.sourceMaterialName}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleUpdateDraftStatus(q.id, 'REJECTED')}
                        className="px-3 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                      >
                        <XCircle size={13} /> Từ chối
                      </button>
                      <button
                        type="button"
                        onClick={() => handleUpdateDraftStatus(q.id, 'APPROVED')}
                        className="px-3 py-1 bg-emerald-600 text-white hover:bg-emerald-700 text-[11px] font-semibold rounded-lg flex items-center gap-1"
                      >
                        <CheckCircle2 size={13} /> Chấp nhận (Approve)
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={handleFinishReview}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                Hoàn tất & Lưu các câu Approved vào Ngân Hàng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
