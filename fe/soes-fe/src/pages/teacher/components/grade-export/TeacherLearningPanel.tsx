import { MessageSquareText, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { askTeacherLearningAgent, getTeacherLearningInsights, type TeacherLearningAnswer, type TeacherLearningInsights } from '../../api/teacher-learning.api'
import { getApiErrorMessage } from '../../../../api/errors'

const SIGNAL_LABELS = {
  INSUFFICIENT_DATA: 'Chưa đủ dữ liệu',
  VERY_HARD: 'Có thể quá khó',
  VERY_EASY: 'Có thể quá dễ',
  NORMAL: 'Trong khoảng theo dõi',
} as const

export default function TeacherLearningPanel({ scheduleId }: { scheduleId: string }) {
  const [insights, setInsights] = useState<TeacherLearningInsights | null>(null)
  const [answer, setAnswer] = useState<TeacherLearningAnswer | null>(null)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!scheduleId) return
    let active = true
    setLoading(true)
    setInsights(null)
    setAnswer(null)
    setError('')
    getTeacherLearningInsights(scheduleId)
      .then((data) => { if (active) setInsights(data) })
      .catch(() => { if (active) setError('Không thể tải phân tích ca thi.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [scheduleId])

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const question = message.trim()
    if (!question || !scheduleId || asking) return
    setAsking(true)
    setError('')
    try {
      setAnswer(await askTeacherLearningAgent(scheduleId, question))
      setMessage('')
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Trợ lý hiện chưa thể phân tích. Hãy thử lại sau.'))
    } finally {
      setAsking(false)
    }
  }

  if (!scheduleId) return null
  return <section className="rounded-xl border border-slate-200 bg-white p-5">
    <div className="flex items-center gap-2 text-blue-700"><MessageSquareText size={18} /><h2 className="font-semibold">Phân tích chất lượng câu hỏi</h2></div>
    <p className="mt-1 text-sm text-slate-500">Số liệu từ lượt thi đã chấm điểm trong ca đã chọn. Gợi ý AI chỉ để tham khảo.</p>
    {loading && <p className="mt-4 text-sm text-slate-500">Đang tải phân tích...</p>}
    {insights && <>
      <p className="mt-4 text-sm font-medium">{insights.analyzedAttemptCount} lượt thi được phân tích
        {insights.limitedToRecentAttempts && ' (chỉ các lượt gần đây)'}.</p>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="text-sm font-semibold">Chủ đề</h3>
          {insights.topics.length === 0 && <p className="mt-2 text-sm text-slate-500">Chưa có câu hỏi được gắn chủ đề.</p>}
          {insights.topics.slice(0, 5).map((topic) => <p key={topic.topicId} className="mt-2 text-sm">
            {topic.name}: {topic.percentage}% · {topic.questionCount} lượt trả lời
            {!topic.sufficientData && <span className="text-amber-700"> · chưa đủ dữ liệu</span>}
          </p>)}
        </div>
        <div className="rounded-lg bg-slate-50 p-4">
          <h3 className="text-sm font-semibold">Câu cần rà soát</h3>
          {insights.questions.length === 0 && <p className="mt-2 text-sm text-slate-500">Chưa có câu hỏi đã chấm điểm.</p>}
          {insights.questions.length > 0 && insights.questions.every((item) => item.signal === 'INSUFFICIENT_DATA') &&
            <p className="mt-2 text-sm text-amber-700">Chưa đủ số lượt và số sinh viên để đánh giá độ khó câu hỏi.</p>}
          {insights.questions.some((item) => item.signal === 'NORMAL')
            && insights.questions.every((item) => item.signal === 'NORMAL' || item.signal === 'INSUFFICIENT_DATA') &&
            <p className="mt-2 text-sm text-slate-500">Chưa có câu vượt ngưỡng cần rà soát.</p>}
          {insights.questions.filter((item) => item.signal === 'VERY_HARD' || item.signal === 'VERY_EASY').slice(0, 5).map((item) => <p key={item.questionId} className="mt-2 text-sm">
            {item.title}: {SIGNAL_LABELS[item.signal]} · {item.exposureCount} lượt · {item.respondentCount} sinh viên
          </p>)}
        </div>
      </div>
      {insights.classes.length > 0 && <div className="mt-3 rounded-lg bg-slate-50 p-4">
        <h3 className="text-sm font-semibold">Theo lớp học phần</h3>
        <div className="mt-2 grid gap-3 md:grid-cols-2">
          {insights.classes.map((group) => {
            const topics = group.topics.filter((topic) => topic.sufficientData)
            return <div key={group.courseOfferingId} className="rounded-lg border border-slate-200 bg-white p-3 text-sm">
              <p className="font-semibold text-slate-900">{group.code} · {group.studentCount} sinh viên</p>
              {!group.sufficientData ? <p className="mt-1 text-amber-700">Chưa đủ dữ liệu để kết luận về lớp.</p>
                : topics.length === 0 ? <p className="mt-1 text-slate-500">Chưa có chủ đề đủ dữ liệu.</p>
                  : topics.slice(0, 3).map((topic) =>
                    <p key={topic.topicId} className="mt-1 text-slate-600">{topic.name}: {topic.percentage}% · {topic.questionCount} lượt trả lời</p>)}
            </div>
          })}
        </div>
      </div>}
    </>}
    <form onSubmit={(event) => void ask(event)} className="mt-4 flex gap-2">
      <input aria-label="Câu hỏi phân tích ca thi" value={message} onChange={(event) => setMessage(event.target.value)}
        maxLength={500} placeholder="Ví dụ: Chủ đề nào lớp cần ôn thêm?"
        className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
      <button type="submit" disabled={asking || !message.trim()}
        className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
        <Send size={15} /> {asking ? 'Đang phân tích...' : 'Hỏi AI'}
      </button>
    </form>
    {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
    {answer && <div className="mt-4 rounded-lg bg-blue-50 p-4 text-sm">
      <p className="font-medium">{answer.summary}</p>
      {answer.actions.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">{answer.actions.map((action, index) => <li key={index}>{action}</li>)}</ul>}
      {answer.caveat && <p className="mt-2 text-slate-600">{answer.caveat}</p>}
    </div>}
  </section>
}
