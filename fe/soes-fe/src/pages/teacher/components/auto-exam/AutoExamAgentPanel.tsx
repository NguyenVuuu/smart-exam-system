import { Sparkles } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { getApiErrorMessage } from '../../../../api/errors'
import { getLearningTopics, type LearningTopic } from '../../api/teacher-questions.api'
import { proposeAgentExamDraft, type AgentExamDraft } from '../../api/teacher-ai-exam.api'

interface Props {
  subjectId: string
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  onApply: (proposal: AgentExamDraft) => void
  onInvalidate: () => void
}

export default function AutoExamAgentPanel({ subjectId, format, onApply, onInvalidate }: Props) {
  const [message, setMessage] = useState('')
  const [desiredCount, setDesiredCount] = useState(10)
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [topicTargets, setTopicTargets] = useState<Record<string, number>>({})
  const [proposal, setProposal] = useState<AgentExamDraft | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!subjectId) return
    let active = true
    getLearningTopics(subjectId)
      .then((items) => { if (active) setTopics(items) })
      .catch(() => { if (active) setError('Không thể tải chủ đề môn học.') })
    return () => { active = false }
  }, [subjectId])

  const suggest = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!subjectId || !message.trim() || loading) return
    setLoading(true)
    setError('')
    setProposal(null)
    try {
      setProposal(await proposeAgentExamDraft({
        subjectId, format, desiredCount, message: message.trim(),
        topicTargets: Object.entries(topicTargets).filter(([, count]) => count > 0)
          .map(([topicId, count]) => ({ topicId, count })),
      }))
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Không thể đề xuất đề. Kiểm tra ngân hàng câu hỏi hoặc thử lại.'))
    } finally {
      setLoading(false)
    }
  }

  const invalidate = () => { setProposal(null); onInvalidate() }

  return <section className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
    <div className="flex items-center gap-2 text-blue-700"><Sparkles size={19} /><h2 className="font-semibold">Trợ lý sinh đề theo yêu cầu</h2></div>
    <p className="mt-1 text-sm text-slate-600">Mô tả nội dung và mức độ mong muốn. AI chọn câu từ ngân hàng; bạn xem lại trước khi lưu đề nháp.</p>
    <form onSubmit={(event) => void suggest(event)} className="mt-4 space-y-4">
      <label className="block text-sm font-medium text-slate-800">Yêu cầu đề thi
        <textarea value={message} onChange={(event) => { setMessage(event.target.value); invalidate() }} maxLength={1000} rows={3}
          placeholder="Ví dụ: Tạo đề kiểm tra kiến thức lập trình căn bản, ưu tiên câu vận dụng về vòng lặp và mảng."
          className="mt-1 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500" />
      </label>
      <label className="block text-sm font-medium text-slate-800">Số câu
        <input type="number" min={1} max={100} value={desiredCount}
          onChange={(event) => { setDesiredCount(Number(event.target.value)); invalidate() }}
          className="mt-1 block w-24 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm" />
      </label>
      {topics.length > 0 && <div>
        <p className="text-sm font-medium text-slate-800">Số câu tối thiểu theo chủ đề <span className="font-normal text-slate-500">(tùy chọn)</span></p>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {topics.map((topic) => <label key={topic.id} className="flex items-center justify-between gap-2 rounded-xl border border-blue-100 bg-white px-3 py-2 text-sm">
            <span className="min-w-0 truncate" title={topic.name}>{topic.name}</span>
            <input type="number" aria-label={`Số câu chủ đề ${topic.name}`} min={0} max={desiredCount}
              value={topicTargets[topic.id] ?? 0}
              onChange={(event) => { setTopicTargets((current) => ({ ...current, [topic.id]: Number(event.target.value) })); invalidate() }}
              className="w-16 rounded-lg border border-slate-300 px-2 py-1 text-center" />
          </label>)}
        </div>
      </div>}
      <button type="submit" disabled={loading || !subjectId || !message.trim() || desiredCount < 1 || desiredCount > 100}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? 'Đang chọn câu...' : 'Đề xuất đề thi'}
      </button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
    {proposal && <div className="mt-5 rounded-xl border border-blue-100 bg-white p-4 text-sm">
      <p className="font-semibold text-slate-900">{proposal.questionIds.length} câu · Dễ {proposal.difficultyMatrix.easy} · Trung bình {proposal.difficultyMatrix.medium} · Khó {proposal.difficultyMatrix.hard}</p>
      <p className="mt-1 text-slate-600">{proposal.rationale}</p>
      <p className="mt-3 font-semibold">Phân bố chủ đề</p>
      <p className="mt-1 text-slate-600">{proposal.topicMatrix.length
        ? proposal.topicMatrix.map((topic) => `${topic.name}: ${topic.count}`).join(' · ')
        : 'Chưa có câu được gắn chủ đề'}{proposal.unlabeledCount ? ` · Chưa gắn: ${proposal.unlabeledCount}` : ''}</p>
      <ol className="mt-3 max-h-56 list-decimal space-y-1 overflow-y-auto pl-5 text-slate-700">
        {proposal.questions.map((question) => <li key={question.id}>{question.title}
          <span className="ml-2 text-xs text-slate-500">{question.difficulty} · {question.topics.join(', ') || 'Chưa gắn chủ đề'}</span>
        </li>)}
      </ol>
      <button type="button" onClick={() => { onApply(proposal); setProposal(null) }}
        className="mt-4 rounded-xl border border-blue-300 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-50">
        Dùng đề xuất này
      </button>
    </div>}
  </section>
}
