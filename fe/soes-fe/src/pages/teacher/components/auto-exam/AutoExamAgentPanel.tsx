import { Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { getApiErrorMessage } from '../../../../api/errors'
import { getLearningTopics, type LearningTopic } from '../../api/teacher-questions.api'
import { proposeAgentExamDraft, type AgentExamDraft } from '../../api/teacher-ai-exam.api'
import AgentExamProposalPreview from './AgentExamProposalPreview'

interface Props {
  subjectId: string
  format: 'OBJECTIVE' | 'PROGRAMMING' | 'MIXED'
  proposal: AgentExamDraft | null
  targetTotalPoints: number
  isSaving: boolean
  isSaved: boolean
  onProposal: (proposal: AgentExamDraft) => void
  onInvalidate: () => void
  onSaveDraft: () => void
}

export default function AutoExamAgentPanel({
  subjectId, format, proposal, targetTotalPoints, isSaving, isSaved,
  onProposal, onInvalidate, onSaveDraft,
}: Props) {
  const [message, setMessage] = useState('')
  const [desiredCount, setDesiredCount] = useState(10)
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [topicTargets, setTopicTargets] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const requestVersion = useRef(0)

  useEffect(() => () => { requestVersion.current += 1 }, [])

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
    invalidate()
    const version = requestVersion.current
    setLoading(true)
    try {
      const next = await proposeAgentExamDraft({
        subjectId, format, desiredCount, message: message.trim(),
        topicTargets: Object.entries(topicTargets).filter(([, count]) => count > 0)
          .map(([topicId, count]) => ({ topicId, count })),
      })
      if (version === requestVersion.current) onProposal(next)
    } catch (cause) {
      if (version === requestVersion.current) {
        setError(getApiErrorMessage(cause, 'Không thể đề xuất đề. Kiểm tra ngân hàng câu hỏi hoặc thử lại.'))
      }
    } finally {
      if (version === requestVersion.current) setLoading(false)
    }
  }

  const invalidate = () => {
    requestVersion.current += 1
    setLoading(false)
    setError('')
    onInvalidate()
  }

  return <section className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
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
    {proposal && <AgentExamProposalPreview proposal={proposal} targetTotalPoints={targetTotalPoints}
      isSaving={isSaving} isSaved={isSaved} onSaveDraft={onSaveDraft} />}
  </section>
}
