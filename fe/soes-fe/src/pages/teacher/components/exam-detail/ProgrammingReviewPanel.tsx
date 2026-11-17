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
        <p className="font-semibold text-blue-900">Phân tích mã nguồn bằng AI</p>
        <p className="text-xs text-slate-600">Giải thích cách làm và gợi ý cải thiện dựa trên mã đã nộp, đề bài và kết quả Judge; điểm chấm không thay đổi.</p>
      </div>
      <button type="button" disabled={loading} onClick={() => void analyze()}
        className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
        <Sparkles size={14} /> {loading ? 'Đang phân tích...' : review ? 'Phân tích lại' : 'Gợi ý nhận xét'}
      </button>
    </div>
    {error && <p role="alert" className="mt-3 text-red-700">{error}</p>}
    {review && <div className="mt-4 space-y-4 text-slate-800">
      <section><h3 className="font-semibold text-slate-900">Kết quả kiểm thử</h3><p className="mt-1">{review.summary}</p></section>
      <section><h3 className="font-semibold text-slate-900">Cách làm trong mã sinh viên</h3>
        <p className="mt-1">{review.approach || 'Chưa đủ căn cứ để mô tả chắc chắn cách làm từ mã đã nộp.'}</p>
        {review.approach && review.approachEvidence && <code className="mt-2 block overflow-x-auto rounded-lg bg-white px-3 py-2 text-xs text-slate-700">{review.approachEvidence}</code>}
      </section>
      <section><h3 className="font-semibold text-slate-900">Độ phức tạp ước lượng</h3>
        {review.timeComplexity || review.spaceComplexity ? <>
          <p className="mt-1">Thời gian: <strong>{review.timeComplexity || 'Chưa xác định'}</strong> · Bộ nhớ: <strong>{review.spaceComplexity || 'Chưa xác định'}</strong></p>
          {review.complexityReasoning && <p className="mt-1 text-slate-600">{review.complexityReasoning}</p>}
          {review.timeComplexityEvidence && <p className="mt-1 text-xs text-slate-500">Căn cứ thời gian: <code>{review.timeComplexityEvidence}</code></p>}
          {review.spaceComplexityEvidence && <p className="mt-1 text-xs text-slate-500">Căn cứ bộ nhớ: <code>{review.spaceComplexityEvidence}</code></p>}
        </> : <p className="mt-1 text-slate-600">Chưa đủ căn cứ từ mã để ước lượng đáng tin cậy.</p>}
      </section>
      {review.suggestions.length > 0 && <section><h3 className="font-semibold text-slate-900">Điểm cần kiểm tra và cải thiện</h3>
        <ul className="mt-1 list-disc space-y-1 pl-5">
          {review.suggestions.map((suggestion, index) => <li key={index}>{suggestion}</li>)}
        </ul>
      </section>}
      <p className="border-t border-blue-100 pt-2 text-xs text-slate-600">{review.caveat}</p>
    </div>}
  </div>
}
