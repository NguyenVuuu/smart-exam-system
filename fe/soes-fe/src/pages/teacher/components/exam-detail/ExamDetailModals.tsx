import { Check, Code, Eye, EyeOff, X } from 'lucide-react'
import HtmlContent from '../../../../components/common/HtmlContent'
import { PROGRAMMING_LANGUAGE_LABELS } from '../../../../constants/programmingLanguages'
import type { Exam, ExamSubmission } from '../../types/teacher-exam.types'
import { examStatusLabel } from '../../constants/examStatus'
import SubmissionAnswerList from './SubmissionAnswerList'

export { default as EvidenceImageModal } from '../proctoring/EvidenceImageModal'

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
              {exam.title} • {examStatusLabel[exam.status]}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-hidden flex flex-col min-h-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <PreviewStat label="Trạng thái" value={examStatusLabel[exam.status]} />
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
                .map((item) => <ExamPreviewQuestion key={`${exam.id}-${item.questionId}-${item.order}`} item={item} />)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExamPreviewQuestion({ item }: { item: Exam['questions'][number] }) {
  const question = item.question
  const isProgramming = question.type === 'PROGRAMMING'

  return (
    <div className="p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-blue-600">Câu {item.order}</span>
        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">
          {isProgramming ? 'Lập trình' : 'Trắc nghiệm'}
        </span>
        <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
          {item.points} điểm
        </span>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-semibold leading-6 text-gray-950">{question.title}</h4>
        {isProgramming && (
          <div className="space-y-1">
            <p className="text-[11px] font-semibold uppercase text-gray-400">Mô tả bài toán</p>
            <HtmlContent
              content={question.content}
              className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 text-xs font-medium leading-6 text-gray-800"
            />
          </div>
        )}
      </div>

      {question.options && question.options.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {question.options.map((option) => (
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

      {isProgramming && (
        <div className="rounded-xl border border-gray-100 bg-white p-3 space-y-3">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
              <Code size={14} /> {question.programmingLanguage ? PROGRAMMING_LANGUAGE_LABELS[question.programmingLanguage] : 'Chưa chọn compiler'}
            </span>
            <div className="flex flex-wrap gap-2 text-xs text-gray-600">
              <PreviewConfigPill label="Thời gian" value={`${question.timeLimitMs ?? 1000}ms`} />
              <PreviewConfigPill label="Bộ nhớ" value={`${question.memoryLimitMb ?? 128}MB`} />
              <PreviewConfigPill label="Mã nguồn" value={`${question.maxCodeSizeKb ?? 64}KB`} />
            </div>
          </div>

          {question.testCases?.length ? (
            <div className="space-y-2">
              {question.testCases.map((testCase, index) => (
                <div key={testCase.id} className="rounded-lg border border-gray-100 bg-gray-50 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-blue-700">Test case #{index + 1}</span>
                    <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-semibold ${
                      testCase.isHidden
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    }`}>
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
}

function PreviewConfigPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1 font-medium">
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
      <pre className={`mt-1 whitespace-pre-wrap break-words ${tone === 'success' ? 'text-emerald-700' : 'text-gray-800'}`}>
        {value || '-'}
      </pre>
    </div>
  )
}

export function StudentSubmissionReviewModal({
  exam,
  submission,
  onClose,
}: {
  exam: Exam
  submission: ExamSubmission | null
  onClose: () => void
}) {
  if (!submission) return null

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
          <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-4">
            <PreviewStat label="Chấm tự động" value={submission.autoScore === null ? '-' : `${submission.autoScore}đ`} />
            <PreviewStat label="Điểm phúc khảo" value={submission.manualScoreOverride != null ? `${submission.manualScoreOverride}đ` : '-'} />
            <PreviewStat label="Điểm chốt" value={submission.finalScore === null ? '-' : `${submission.finalScore}đ`} />
            <PreviewStat label="Trạng thái" value={submission.status} />
          </div>

          {!!submission.sectionScores?.length && (
            <div className="flex flex-wrap gap-2">
              {submission.sectionScores.map((section) => (
                <span key={section.id} className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700">
                  {section.title}: <strong>{section.score}/{section.maxScore}đ</strong>
                </span>
              ))}
            </div>
          )}

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
            <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
              <span className="text-sm font-semibold text-gray-900">Bài làm đã nộp</span>
            </div>

            <SubmissionAnswerList exam={exam} submission={submission} />
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
