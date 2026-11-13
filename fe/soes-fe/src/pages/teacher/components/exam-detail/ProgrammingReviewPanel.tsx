import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { getApiErrorMessage } from '../../../../api/errors'
import { reviewProgrammingSubmission, type ProgrammingReview } from '../../api/teacher-learning.api'

export default function ProgrammingReviewPanel({ attemptId, examQuestionId }: {
  attemptId: string
  examQuestionId: string
}) {
  const [review, setReview] = useState<ProgrammingReview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const analyze = async () => {
    setLoading(true)
    setError('')
    try { setReview(await reviewProgrammingSubmission(attemptId, examQuestionId)) }
    catch (cause) { setError(getApiErrorMessage(cause, 'Chưa thể phân tích bài lập trình. Vui lòng thử lại sau.')) }
    finally { setLoading(false) }
  }

  return <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-3 text-sm">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div>
        <p className="font-semibold text-blue-900">Gợi ý nhận xét bằng AI</p>
        <p className="text-xs text-slate-600">Dựa trên mã đã nộp và kết quả Judge; điểm chấm không thay đổi.</p>
      </div>
      <button type="button" disabled={loading} onClick={() => void analyze()}
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        <Sparkles size={14} /> {loading ? 'Đang phân tích...' : review ? 'Phân tích lại' : 'Gợi ý nhận xét'}
      </button>
    </div>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    {review && <div className="mt-3 space-y-2 text-slate-800">
      <p>{review.summary}</p>
      {review.suggestions.length > 0 && <ul className="list-disc space-y-1 pl-5">
        {review.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
      </ul>}
      <p className="text-xs text-slate-600">{review.caveat}</p>
    </div>}
  </div>
}
