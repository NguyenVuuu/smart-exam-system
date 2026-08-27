import { Check, Code, Edit, X } from 'lucide-react'
import type { Exam, ExamSubmission } from '../../types/teacher-exam.types'

export function ScoreOverrideModal({
  submission,
  overrideScoreInput,
  overrideReason,
  maxScore,
  onScoreChange,
  onReasonChange,
  onClose,
  onApply,
}: {
  submission: ExamSubmission | null
  overrideScoreInput: number
  overrideReason: string
  maxScore: number
  onScoreChange: (score: number) => void
  onReasonChange: (reason: string) => void
  onClose: () => void
  onApply: () => void
}) {
  if (!submission) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150 font-sans">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 font-sans">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Edit size={16} />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Chấm Lại & Sửa Điểm Phúc Khảo</h3>
              <p className="text-xs text-gray-500">Ghi đè điểm thi chính thức cho bài nộp của thí sinh</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-100 grid grid-cols-2 gap-3">
            <div>
              <span className="text-gray-400 text-xs block">Thí sinh:</span>
              <span className="font-bold text-gray-900">{submission.studentName}</span>
              <span className="text-blue-600 block text-xs font-semibold">MSSV: {submission.studentCode}</span>
            </div>
            <div>
              <span className="text-gray-400 text-xs block">Điểm tự động hiện tại:</span>
              <span className="text-xs font-bold text-gray-900">{submission.autoScore} / {maxScore}đ</span>
              <span className="text-emerald-600 block text-xs font-medium">Nộp lúc {submission.submittedAt}</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block font-bold text-gray-700">Điểm chốt mới (Tối đa {maxScore}):</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max={maxScore}
              value={overrideScoreInput}
              onChange={(e) => onScoreChange(Number(e.target.value))}
              className="w-full bg-gray-50 border border-gray-200 text-xs font-bold rounded-xl p-3 text-blue-700 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block font-semibold text-gray-700">Lý do điều chỉnh điểm / Ghi chú phúc khảo:</label>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Ví dụ: Chấm lại test case câu 2 do sai sót định dạng input..."
              className="w-full bg-gray-50 border border-gray-200 text-xs rounded-xl p-2.5 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-gray-100">
          <button onClick={onClose} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors">
            Hủy bỏ
          </button>
          <button
            onClick={onApply}
            disabled={overrideReason.trim().length < 5 || overrideScoreInput < 0 || overrideScoreInput > maxScore}
            className="px-5 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl hover:bg-blue-700 shadow-xs transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            Lưu & Cập Nhật Điểm Chốt
          </button>
        </div>
      </div>
    </div>
  )
}

export function EvidenceImageModal({
  imageUrl,
  onClose,
}: {
  imageUrl: string | null
  onClose: () => void
}) {
  if (!imageUrl) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
        <div className="flex justify-between items-center border-b border-gray-100 pb-3">
          <h3 className="text-base font-bold text-gray-900">Ảnh Bằng Chứng Tự Động Từ Webcam</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <img src={imageUrl} alt="Evidence" className="w-full rounded-xl border border-gray-200" />
      </div>
    </div>
  )
}

export function ExamPreviewModal({
  exam,
  isOpen,
  onClose,
}: {
  exam: Exam
  isOpen: boolean
  onClose: () => void
}) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Xem trước đề thi</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {exam.title} • {exam.status === 'DRAFT' ? 'Bản nháp chưa công bố' : 'Đề đã khóa'}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <PreviewStat label="Trạng thái" value={exam.status} />
            <PreviewStat label="Tổng câu" value={exam.questions.length} />
            <PreviewStat label="Thời lượng mặc định" value={`${exam.defaultDurationMinutes} phút`} />
            <PreviewStat label="Tổng điểm" value={`${exam.totalPoints} điểm`} />
          </div>

          <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 text-sm font-semibold text-gray-900">
              Danh sách câu hỏi
            </div>
            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {exam.questions
                .slice()
                .sort((a, b) => a.order - b.order)
                .map((item) => (
                  <div key={`${exam.id}-${item.questionId}-${item.order}`} className="p-4 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600">Câu {item.order}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        {item.question.type === 'PROGRAMMING' ? 'Lập trình' : 'Trắc nghiệm'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                        {item.points} điểm
                      </span>
                    </div>
                    <p className="text-xs text-gray-800 font-medium leading-relaxed">
                      {item.question.content}
                    </p>
                    {item.question.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        {item.question.options.map((option) => (
                          <div
                            key={option.id}
                            className={`flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs ${
                              option.isCorrect
                                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 font-semibold'
                                : 'bg-gray-50 border-gray-100 text-gray-600'
                            }`}
                          >
                            {option.isCorrect && <Check size={13} className="shrink-0" />}
                            <span>{option.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {item.question.explanation && (
                      <p className="text-xs text-gray-500 pt-1">
                        Giải thích: {item.question.explanation}
                      </p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function StudentSubmissionReviewModal({
  exam,
  submission,
  onClose,
  onEditScore,
}: {
  exam: Exam
  submission: ExamSubmission | null
  onClose: () => void
  onEditScore: (submission: ExamSubmission) => void
}) {
  if (!submission) return null

  const orderedQuestions = exam.questions.slice().sort((a, b) => a.order - b.order)

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-6xl h-[92vh] shadow-2xl border border-gray-100 overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-xs font-bold text-gray-900">Xem lại bài làm sinh viên</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {submission.studentName} • {submission.studentCode} • Nộp lúc {submission.submittedAt}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <PreviewStat label="Chấm tự động" value={`${submission.autoScore}đ`} />
            <PreviewStat label="Ghi đè thủ công" value={submission.manualScoreOverride !== undefined ? `${submission.manualScoreOverride}đ` : '-'} />
            <PreviewStat label="Điểm chốt" value={`${submission.finalScore}đ`} />
            <PreviewStat label="Trạng thái" value={submission.status} />
          </div>

          {(submission.regradeRequest || submission.scoreAdjustments?.length) && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs text-amber-900">
              {submission.regradeRequest && (
                <p>
                  <span className="font-semibold">Yêu cầu phúc khảo:</span> {submission.regradeRequest.reason}
                </p>
              )}
              {submission.scoreAdjustments?.length ? (
                <p className="mt-1">
                  <span className="font-semibold">Lịch sử điều chỉnh:</span>{' '}
                  {submission.scoreAdjustments.map((adjustment) =>
                    `${adjustment.oldScore}đ → ${adjustment.newScore}đ, ${adjustment.adjustedBy} (${adjustment.adjustedAt})`,
                  ).join(' • ')}
                </p>
              ) : null}
            </div>
          )}

          <div className="border border-gray-100 rounded-xl overflow-hidden flex flex-col min-h-0 flex-1">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900">Bài làm đã nộp</span>
              <button
                type="button"
                onClick={() => onEditScore(submission)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Edit size={14} /> Chấm lại
              </button>
            </div>

            <div className="divide-y divide-gray-100 overflow-y-auto flex-1">
              {orderedQuestions.map((item, index) => {
                const answer = submission.answers?.find((candidate) => candidate.questionId === item.questionId)
                const selectedOptionIds = answer?.selectedOptionIds ?? []
                const codingResults = submission.codingResults?.filter(
                  (result) => result.questionId === item.questionId,
                ) ?? []
                const passedTests = codingResults.filter((result) => result.passed).length

                return (
                  <div key={`${submission.id}-${item.questionId}-${index}`} className="p-4 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-semibold text-blue-600">Câu {index + 1}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
                        {item.question.type === 'PROGRAMMING' ? 'Lập trình' : 'Trắc nghiệm'}
                      </span>
                      <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                        {item.points} điểm
                      </span>
                    </div>
                    <p className="text-xs text-gray-900 font-medium leading-relaxed">{item.question.content}</p>

                    {item.question.options && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {item.question.options.map((option) => {
                          const isSelected = selectedOptionIds.includes(option.id)
                          return (
                            <div
                              key={option.id}
                              className={`rounded-lg border px-2.5 py-1.5 text-xs flex items-center gap-2 ${
                                option.isCorrect
                                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                                  : isSelected
                                  ? 'bg-rose-50 border-rose-100 text-rose-700'
                                  : 'bg-gray-50 border-gray-100 text-gray-600'
                              }`}
                            >
                              {isSelected && <Check size={13} className="shrink-0" />}
                              <span>{option.content}</span>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {item.question.type === 'PROGRAMMING' && (
                      <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 text-xs space-y-2">
                        <pre className="overflow-x-auto rounded-lg bg-gray-900 p-3 text-gray-100">{answer?.sourceCode || 'Sinh viên không nộp mã nguồn.'}</pre>
                        <p className="font-medium text-gray-900 flex items-center gap-1">
                          <Code size={13} className="text-blue-600" /> Kết quả chạy test
                        </p>
                        <p className="text-gray-600">
                          {codingResults.length
                            ? `${passedTests}/${codingResults.length} test case đạt`
                            : 'Chưa có dữ liệu test case mẫu trong mock.'}
                        </p>
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
    <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
      <span className="text-gray-500 text-xs font-medium">{label}</span>
      <p className="font-bold text-gray-900 text-sm mt-0.5">{value}</p>
    </div>
  )
}
