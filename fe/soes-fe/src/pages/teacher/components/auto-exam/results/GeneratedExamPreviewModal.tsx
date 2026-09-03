import { CheckCircle2, X } from 'lucide-react'
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
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Xem trước đề đã sinh ({examCode.id})</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {examTitle} • {examCategory} • {draftStatus === 'SAVED_DRAFT' ? 'Bản nháp đã lưu' : 'Bản sinh thử chưa lưu'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-hidden flex flex-col min-h-0 flex-1">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm shrink-0">
            <PreviewStat label="Thời lượng làm bài" value={`${durationMinutes} phút`} />
            <PreviewStat label="Tổng điểm mục tiêu" value={`${examCode.totalPoints.toFixed(1)} điểm`} />
            <PreviewStat label="Số lượng câu hỏi" value={`${examCode.exam.questions.length} câu`} />
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1 bg-white shadow-2xs">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-900 shrink-0 flex items-center justify-between">
              <span>Danh sách câu hỏi trong đề ({examCode.id})</span>
              <span className="text-sm text-blue-600 font-semibold">{examCode.exam.questions.length} câu hỏi</span>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2">
              {examCode.exam.questions.map((question, idx) => (
                <div key={`${examCode.id}-${question.id}-${idx}`} className="p-4 sm:p-5 space-y-2 hover:bg-gray-50/50 transition-colors rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-bold text-blue-600">Câu {idx + 1}</span>
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                      {question.type === 'SINGLE_CHOICE'
                        ? '1 đáp án'
                        : question.type === 'MULTIPLE_CHOICE'
                        ? 'Nhiều đáp án'
                        : question.type === 'TRUE_FALSE'
                        ? 'Đúng / Sai'
                        : 'Lập trình'}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-semibold">
                      Mức độ: {question.difficulty}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                      {question.points} điểm
                    </span>
                  </div>
                  <p className="text-sm text-gray-900 font-medium leading-relaxed">
                    {question.title || question.content}
                  </p>
                  {question.options.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1.5">
                      {question.options.map((option) => (
                        <div
                          key={option.id}
                          className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-sm ${
                            option.isCorrect
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                              : 'bg-gray-50 border-gray-100 text-gray-700'
                          }`}
                        >
                          {option.isCorrect && <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />}
                          <span>{option.content}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {question.type === 'PROGRAMMING' && question.testCases.length > 0 && (
                    <p className="text-xs font-semibold text-gray-500">
                      {question.testCases.length} test case chấm bài
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors"
          >
            Đóng xem trước
          </button>
        </div>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-1">
      <span className="text-xs text-gray-500 font-semibold">{label}</span>
      <p className="text-base font-bold text-gray-900">{value}</p>
    </div>
  )
}
