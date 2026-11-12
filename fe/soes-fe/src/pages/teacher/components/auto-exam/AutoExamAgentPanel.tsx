import { Sparkles } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { getApiErrorMessage } from '../../../../api/errors'
import { suggestExamMatrix, type ExamMatrixProposal, type ExamMatrixSuggestion } from '../../api/teacher-ai-exam.api'

interface Props {
  subjectId: string
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  currentCount: number
  onApply: (proposal: ExamMatrixProposal) => void
}

export default function AutoExamAgentPanel({ subjectId, format, currentCount, onApply }: Props) {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [desiredCount, setDesiredCount] = useState(currentCount || 10)
  const [suggestion, setSuggestion] = useState<ExamMatrixSuggestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const proposal = suggestion?.proposal

  const suggest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!subjectId || !message.trim() || loading) return
    setLoading(true)
    setError('')
    setSuggestion(null)
    try {
      setSuggestion(await suggestExamMatrix({ subjectId, format, desiredCount, message: message.trim() }))
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Không thể đề xuất ma trận. Kiểm tra số câu trong ngân hàng hoặc thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  return <section className="mb-5 rounded-xl border border-blue-200 bg-blue-50 p-5">
    <div className="flex items-center gap-2 text-blue-700"><Sparkles size={18} /><h2 className="font-semibold">Trợ lý thiết kế ma trận đề</h2></div>
    <p className="mt-1 text-sm text-slate-600">Mô tả mục tiêu đề thi. AI chỉ gợi ý số câu; bạn kiểm tra và chọn áp dụng trước khi sinh bản nháp.</p>
    <form onSubmit={(event) => void suggest(event)} className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor="agent-question-count" className="text-sm font-medium">Số câu</label>
        <input id="agent-question-count" type="number" min={1} max={100} value={desiredCount}
          onChange={(event) => setDesiredCount(Number(event.target.value))}
          className="w-20 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
        <input value={message} onChange={(event) => setMessage(event.target.value)} maxLength={500}
          aria-label="Yêu cầu thiết kế ma trận" placeholder="Ví dụ: Ưu tiên câu trung bình, có vài câu nâng cao"
          className="min-w-56 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm" />
      </div>
      <button type="submit" disabled={loading || !subjectId || !message.trim() || desiredCount < 1 || desiredCount > 100}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Đang đề xuất...' : 'Đề xuất ma trận'}
      </button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {suggestion?.shortage ? <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
      <p>Ngân hàng còn thiếu ít nhất {suggestion.shortage} câu phù hợp. Hãy tạo câu hỏi nháp từ tài liệu và duyệt trước khi sinh đề.</p>
      <button type="button" onClick={() => navigate(`/teacher/question-bank/ai-generator?${new URLSearchParams({ subjectId, questionCount: String(suggestion.shortage) })}`)}
        className="mt-3 rounded-lg border border-amber-400 px-3 py-2 font-semibold hover:bg-amber-100">Tạo câu hỏi nháp</button>
    </div> : null}
    {proposal && <div className="mt-4 rounded-lg border border-blue-100 bg-white p-4 text-sm">
      <p className="font-semibold">Dễ {proposal.easyCount} · Trung bình {proposal.mediumCount} · Khó {proposal.hardCount}</p>
      <p className="mt-1 text-slate-600">{proposal.rationale}</p>
      <button type="button" onClick={() => { onApply(proposal); setSuggestion(null) }}
        className="mt-3 rounded-lg border border-blue-300 px-3 py-2 font-semibold text-blue-700 hover:bg-blue-50">
        Áp dụng vào ma trận
      </button>
    </div>}
  </section>
}
