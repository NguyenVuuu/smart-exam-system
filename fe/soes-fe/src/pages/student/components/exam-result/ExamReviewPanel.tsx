import { CheckCircle2, Clock3, Code2, FileText, Sparkles, XCircle } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../../../api/errors'
import { explainReviewQuestion, type LearningAnswer } from '../../api/student-learning.api'
import type { AttemptResult, AttemptReviewItem } from '../../api/student-take-exam.api'

function optionTone(item: AttemptReviewItem, optionId: string, isCorrect?: boolean) {
  const selected = item.selectedOptionIds?.includes(optionId) ?? false
  if (isCorrect) return 'border-emerald-200 bg-emerald-50 text-emerald-800'
  if (selected) return 'border-blue-200 bg-blue-50 text-blue-800'
  return 'border-gray-100 bg-gray-50 text-gray-600'
}

function statusIcon(isCorrect: boolean | null) {
  if (isCorrect === true) return <CheckCircle2 size={16} className="text-emerald-600" />
  if (isCorrect === false) return <XCircle size={16} className="text-rose-500" />
  return <FileText size={16} className="text-gray-400" />
}

function ReviewQuestion({ item, showAnswerKey, scheduleId, attemptId }: {
  item: AttemptReviewItem; showAnswerKey: boolean; scheduleId: string; attemptId: string
}) {
  const isProgramming = item.type === 'PROGRAMMING'
  const [question, setQuestion] = useState('Giải thích câu này và cách tránh lỗi tương tự.')
  const [answer, setAnswer] = useState<LearningAnswer | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const explain = async () => {
    if (loading || !question.trim()) return
    setLoading(true)
    setError('')
    try {
      setAnswer(await explainReviewQuestion(scheduleId, attemptId, item.questionId, question.trim()))
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Chưa thể giải thích câu này. Vui lòng thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <article className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
            {statusIcon(item.isCorrect)}
            <span>Câu {item.orderIndex}</span>
            <span>{item.points} điểm</span>
            {item.score !== null && <span>Đạt {item.score} điểm</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm leading-6 text-gray-900">{item.content}</p>
        </div>
      </div>

      {isProgramming ? (
        <div className="mt-4 rounded-lg border border-gray-100 bg-gray-950 p-4 text-xs text-gray-100">
          <div className="mb-2 flex items-center gap-2 font-semibold text-gray-300">
            <Code2 size={14} />
            Mã nguồn đã nộp
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono leading-5">
            {item.draftSourceCode?.trim() || 'Chưa nộp mã nguồn.'}
          </pre>
        </div>
      ) : (
        <div className="mt-4 space-y-2">
          {(item.options ?? []).map((option) => {
            const selected = item.selectedOptionIds?.includes(option.id) ?? false
            return (
              <div
                key={option.id}
                className={`flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${optionTone(item, option.id, option.isCorrect)}`}
              >
                <span>{option.content}</span>
                <span className="shrink-0 text-xs font-semibold">
                  {option.isCorrect ? 'Đáp án đúng' : selected ? 'Đã chọn' : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {showAnswerKey && item.explanation && (
        <div className="mt-4 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs leading-5 text-amber-800">
          {item.explanation}
        </div>
      )}
      {showAnswerKey && <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-3">
        <div className="flex flex-wrap gap-2">
          <input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500}
            aria-label={`Câu hỏi cho trợ lý AI về câu ${item.orderIndex}`}
            className="min-w-48 flex-1 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" />
          <button type="button" onClick={() => void explain()} disabled={loading || !question.trim()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">
            <Sparkles size={15} /> {loading ? 'Đang giải thích...' : 'Hỏi AI về câu này'}
          </button>
        </div>
        {error && <p role="alert" className="mt-2 text-sm text-red-700">{error}</p>}
        {answer && <div className="mt-3 text-sm text-slate-800">
          <p>{answer.summary}</p>
          {answer.actions.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">
            {answer.actions.map((action, index) => <li key={index}>{action}</li>)}
          </ul>}
          {answer.caveat && <p className="mt-2 text-slate-600">{answer.caveat}</p>}
        </div>}
      </div>}
    </article>
  )
}

export default function ExamReviewPanel({ result, scheduleId, attemptId }: {
  result: AttemptResult; scheduleId: string; attemptId: string
}) {
  if (!result.available) return null

  if (result.reviewPolicy === 'NONE' || result.reviewPolicy === 'SCORE_ONLY') {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-600">
        {result.reviewPolicy === 'SCORE_ONLY'
          ? 'Ca thi chỉ cho phép xem điểm tổng.'
          : 'Ca thi không cho phép xem lại bài làm.'}
      </div>
    )
  }

  if (!result.reviewAvailable) {
    return <ReviewLockedState availableAt={result.reviewAvailableAt} />
  }

  if (result.reviewConsumed) {
    return (
      <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-600">
        Lượt xem lại bài làm chỉ khả dụng một lần ngay sau khi nộp bài và đã được sử dụng.
      </div>
    )
  }

  const showAnswerKey = result.reviewPolicy === 'FULL_AFTER_RELEASE'

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-gray-900">Xem lại bài làm</h2>
        <span className="text-xs font-semibold text-gray-500">
          {showAnswerKey ? 'Hiện đáp án đúng và giải thích' : 'Không hiện đáp án đúng'}
        </span>
      </div>

      {result.reviewItems.length === 0 ? (
        <div className="rounded-lg border border-gray-100 bg-white p-4 text-sm text-gray-500">
          Chưa có dữ liệu bài làm để hiển thị.
        </div>
      ) : (
        <div className="space-y-3">
          {result.reviewItems.map((item) => (
            <ReviewQuestion key={item.questionId} item={item} showAnswerKey={showAnswerKey}
              scheduleId={scheduleId} attemptId={attemptId} />
          ))}
        </div>
      )}
    </section>
  )
}

function ReviewLockedState({ availableAt }: { availableAt: string | null }) {
  const formattedTime = formatReviewAvailableAt(availableAt)

  return (
    <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <Clock3 size={18} className="mt-0.5 shrink-0" />
      <div>
        <p className="font-semibold">Chưa thể xem lại bài làm</p>
        <p className="mt-1 text-amber-800">
          {formattedTime
            ? `Bài làm và đáp án sẽ được mở sau khi ca thi kết thúc lúc ${formattedTime}.`
            : 'Bài làm và đáp án chưa được phép hiển thị.'}
        </p>
      </div>
    </div>
  )
}

function formatReviewAvailableAt(value: string | null) {
  if (!value) return null
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}
