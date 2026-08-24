import { CheckCircle2, X } from 'lucide-react'
import { MOCK_QUESTION_BANK } from '../../../mock/teacher-question-bank.mock'
import type { AutoExamDraftStatus, GeneratedExamDraft } from '../../../types/teacher-auto-exam.types'
import type { ExamCategory } from '../../../types/teacher-exam.types'

export default function GeneratedExamPreviewModal({
  examCode,
  examTitle,
  examCategory,
  draftStatus,
  durationMinutes,
  onClose,
}: {
  examCode: GeneratedExamDraft | null
  examTitle: string
  examCategory: ExamCategory
  draftStatus: AutoExamDraftStatus
  durationMinutes: number
  onClose: () => void
}) {
  if (!examCode) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xs font-bold text-gray-900">Xem trước đề đã sinh ({examCode.id})</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {examTitle} • {examCategory} • {draftStatus === 'SAVED_DRAFT' ? 'Bản nháp đã lưu' : 'Bản sinh thử chưa lưu'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 overflow-hidden flex flex-col min-h-0 flex-1">
          {/* Stats Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs shrink-0">
            <PreviewStat label="Thời lượng" value={`${durationMinutes} phút`} />
            <PreviewStat label="Tổng điểm" value={`${examCode.totalPoints.toFixed(1)} điểm`} />
            <PreviewStat label="Số lượng câu hỏi" value={`${examCode.questionIds.length} câu`} />
          </div>

          {/* Question List Container */}
          <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-900 shrink-0 flex items-center justify-between">
              <span>Danh sách câu hỏi trong đề ({examCode.id})</span>
              <span className="text-xs text-blue-600 font-semibold">{examCode.questionIds.length} câu hỏi</span>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {examCode.questionIds.map((questionId, idx) => {
                const question = MOCK_QUESTION_BANK.find((q) => q.id === questionId)

                return (
                  <div key={`${examCode.id}-${questionId}-${idx}`} className="p-4 space-y-1.5 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">Câu {idx + 1}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        {question?.type === 'SINGLE_CHOICE'
                          ? '1 đáp án'
                          : question?.type === 'MULTIPLE_CHOICE'
                          ? 'Nhiều đáp án'
                          : question?.type === 'TRUE_FALSE'
                          ? 'Đúng / Sai'
                          : question?.type === 'PROGRAMMING'
                          ? 'Lập trình'
                          : 'Trắc nghiệm'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                        Mức độ: {question?.difficulty ?? 'AUTO'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                        {examCode.questionPoints[idx] ?? 0} điểm
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">
                      {question?.content ?? `Câu hỏi được chọn tự động (${questionId})`}
                    </p>
                    {question?.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                              option.isCorrect
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-semibold'
                                : 'bg-gray-50 border-gray-100 text-gray-600'
                            }`}
                          >
                            {option.isCorrect && <CheckCircle2 size={13} className="shrink-0 text-emerald-600" />}
                            <span>{option.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-gray-500 font-medium text-xs block">{label}</span>
      <p className="font-bold text-gray-900 mt-0.5 text-sm">{value}</p>
    </div>
  )
}
