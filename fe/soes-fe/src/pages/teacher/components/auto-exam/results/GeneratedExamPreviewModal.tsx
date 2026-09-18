import { CheckCircle2, Code, Eye, EyeOff, X } from 'lucide-react'
import HtmlContent from '../../../../../components/common/HtmlContent'
import { PROGRAMMING_LANGUAGE_LABELS } from '../../../../../constants/programmingLanguages'
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

  const exam = examCode.exam
  const formatLabel =
    exam.format === 'PROGRAMMING'
      ? 'Lập trình'
      : exam.format === 'MIXED'
      ? 'Hỗn hợp'
      : 'Trắc nghiệm'

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 font-sans animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-gray-900">Xem trước đề thi tự động</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {examTitle || exam.title} • {examCategory} • {draftStatus === 'SAVED_DRAFT' ? 'Bản nháp đã lưu' : 'Bản sinh thử chưa lưu'}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs shrink-0">
            <PreviewStat label="Thời lượng làm bài" value={`${durationMinutes} phút`} />
            <PreviewStat label="Tổng điểm mục tiêu" value={`${examCode.totalPoints.toFixed(1)} điểm`} />
            <PreviewStat label="Số lượng câu hỏi" value={`${exam.questions.length} câu`} />
            <PreviewStat label="Định dạng bài thi" value={formatLabel} />
          </div>

          <div className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col min-h-0 flex-1 bg-white shadow-2xs">
            <div className="px-5 py-3.5 bg-gray-50 border-b border-gray-100 text-sm font-bold text-gray-900 shrink-0 flex items-center justify-between">
              <span>Danh sách câu hỏi trong đề</span>
              <span className="text-sm text-blue-600 font-semibold">{exam.questions.length} câu hỏi</span>
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1 p-2">
              {exam.questions.map((question, idx) => {
                const isProgramming = question.type === 'PROGRAMMING'
                const difficultyLabel =
                  question.difficulty === 'EASY'
                    ? 'DỄ'
                    : question.difficulty === 'MEDIUM'
                    ? 'TRUNG BÌNH'
                    : 'KHÓ'
                const typeLabel = isProgramming
                  ? 'Lập trình'
                  : question.type === 'SINGLE_CHOICE'
                  ? '1 đáp án'
                  : question.type === 'MULTIPLE_CHOICE'
                  ? 'Nhiều đáp án'
                  : 'Đúng / Sai'

                return (
                  <div key={`${question.id}-${idx}`} className="p-4 sm:p-5 space-y-3 hover:bg-gray-50/50 transition-colors rounded-xl">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-bold text-blue-600">Câu {idx + 1}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold">
                        {typeLabel}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md text-xs font-semibold">
                        Mức độ: {difficultyLabel}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-bold">
                        {question.points} điểm
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold leading-6 text-gray-950">
                        {question.title || question.content}
                      </h4>
                      {isProgramming && (
                        <div className="space-y-1">
                          <p className="text-[11px] font-semibold uppercase text-gray-400">Mô tả bài toán</p>
                          <HtmlContent
                            content={question.content}
                            className="rounded-xl border border-gray-100 bg-gray-50/70 p-3.5 text-xs font-medium leading-6 text-gray-800"
                          />
                        </div>
                      )}
                    </div>

                    {/* Trắc nghiệm Options */}
                    {!isProgramming && question.options && question.options.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                        {question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-2.5 text-xs ${
                              option.isCorrect
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold'
                                : 'bg-gray-50 border-gray-100 text-gray-700'
                            }`}
                          >
                            {option.isCorrect ? (
                              <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />
                            )}
                            <span>{option.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Lập trình Config & Test cases */}
                    {isProgramming && (
                      <div className="rounded-xl border border-gray-100 bg-white p-3.5 space-y-3 shadow-2xs">
                        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
                            <Code size={14} />{' '}
                            {question.language && question.language in PROGRAMMING_LANGUAGE_LABELS
                              ? PROGRAMMING_LANGUAGE_LABELS[question.language as keyof typeof PROGRAMMING_LANGUAGE_LABELS]
                              : question.language || 'Chưa chọn compiler'}
                          </span>
                          <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                            <PreviewConfigPill label="Thời gian" value={`${question.programmingConfig?.timeLimitMs ?? 1000}ms`} />
                            <PreviewConfigPill label="Bộ nhớ" value={`${question.programmingConfig?.memoryLimitMb ?? 128}MB`} />
                            <PreviewConfigPill label="Mã nguồn" value={`${question.programmingConfig?.maxCodeSizeKb ?? 64}KB`} />
                          </div>
                        </div>

                        {question.testCases && question.testCases.length > 0 ? (
                          <div className="space-y-2 pt-1">
                            <p className="text-[11px] font-semibold uppercase text-gray-400">Danh sách Test Case ({question.testCases.length})</p>
                            {question.testCases.map((testCase, tIdx) => (
                              <div key={testCase.id || `tc-${tIdx}`} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-xs font-semibold text-blue-700">Test case #{tIdx + 1}</span>
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                                      testCase.isHidden
                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    }`}
                                  >
                                    {testCase.isHidden ? <EyeOff size={12} /> : <Eye size={12} />}
                                    {testCase.isHidden ? 'Test ẩn' : 'Công khai'}
                                  </span>
                                </div>
                                <div className="mt-2 grid grid-cols-1 gap-2 font-mono text-xs md:grid-cols-2">
                                  <PreviewCodeBlock label="Input" value={testCase.input} />
                                  <PreviewCodeBlock label="Output kỳ vọng" value={testCase.expectedOutput} tone="success" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-xs text-gray-500">
                            Chưa có test case cho câu lập trình này.
                          </div>
                        )}
                      </div>
                    )}

                    {question.explanation && (
                      <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs leading-6 text-blue-800">
                        <span className="font-semibold">Giải thích:</span> {question.explanation}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-semibold rounded-xl transition-colors cursor-pointer"
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
    <div className="p-3.5 bg-gray-50 border border-gray-100 rounded-xl space-y-0.5">
      <span className="text-[11px] text-gray-500 font-semibold block uppercase tracking-wider">{label}</span>
      <p className="text-sm font-bold text-gray-900 truncate">{value}</p>
    </div>
  )
}

function PreviewConfigPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium text-xs">
      {label}: <strong className="text-gray-900">{value}</strong>
    </span>
  )
}

function PreviewCodeBlock({
  label,
  value,
  tone,
}: {
  label: string
  value: string
  tone?: 'success'
}) {
  return (
    <div className="rounded-lg border border-gray-100 bg-white p-2">
      <span className="block text-[11px] font-sans font-semibold text-gray-400">{label}</span>
      <pre className={`mt-1 whitespace-pre-wrap break-words text-xs ${tone === 'success' ? 'text-emerald-700 font-semibold' : 'text-gray-800'}`}>
        {value || '(Trống)'}
      </pre>
    </div>
  )
}
