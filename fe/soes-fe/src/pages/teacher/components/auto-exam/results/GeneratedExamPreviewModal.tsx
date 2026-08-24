import { CheckCircle2 } from 'lucide-react'
import { MOCK_QUESTION_BANK } from '../../../mock/teacher-question-bank.mock'
import type { AutoExamDraftStatus, GeneratedExamCode } from '../../../types/teacher-auto-exam.types'
import type { ExamCategory } from '../../../types/teacher-exam.types'

export default function GeneratedExamPreviewModal({
  examCode,
  examTitle,
  examCategory,
  draftStatus,
  durationMinutes,
  onClose,
}: {
  examCode: GeneratedExamCode | null
  examTitle: string
  examCategory: ExamCategory
  draftStatus: AutoExamDraftStatus
  durationMinutes: number
  onClose: () => void
}) {
  if (!examCode) return null

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900">Xem Trước {examCode.code}</h2>
            <p className="text-[11px] text-gray-500 mt-0.5">
              {examTitle} • {examCategory} • {draftStatus === 'SAVED_DRAFT' ? 'Bản nháp đã lưu' : 'Bản sinh thử chưa lưu'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <PreviewStat label="Thời lượng" value={`${durationMinutes} phút`} />
            <PreviewStat label="Tổng điểm" value={examCode.totalPoints.toFixed(1)} />
            <PreviewStat label="Điểm mỗi câu" value={examCode.pointsPerQuestion} />
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-900">
              Danh sách câu hỏi trong {examCode.code}
            </div>
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {examCode.questionIds.map((questionId, idx) => {
                const question = MOCK_QUESTION_BANK.find((q) => q.id === questionId)

                return (
                  <div key={`${examCode.code}-${questionId}-${idx}`} className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-600">Câu {idx + 1}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">
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
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-[10px] font-medium">
                        {question?.difficulty ?? 'AUTO'}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-[10px] font-medium">
                        {examCode.pointsPerQuestion} điểm
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
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-[11px] ${
                              option.isCorrect
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-medium'
                                : 'bg-gray-50 border-gray-100 text-gray-600'
                            }`}
                          >
                            {option.isCorrect && <CheckCircle2 size={13} className="shrink-0" />}
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
    <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
      <span className="text-gray-500">{label}</span>
      <p className="font-medium text-gray-900">{value}</p>
    </div>
  )
}
