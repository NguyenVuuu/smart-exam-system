import { BookOpenCheck, Send } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { askLearningAgent, getLearningInsights, getStudyMaterials, type LearningAnswer, type StudentLearningInsights, type StudyMaterial } from './api/student-learning.api'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'

export default function StudentLearningPage() {
  const [insights, setInsights] = useState<StudentLearningInsights | null>(null)
  const [answer, setAnswer] = useState<LearningAnswer | null>(null)
  const [question, setQuestion] = useState('')
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [materialId, setMaterialId] = useState('')
  const [answeredFromMaterial, setAnsweredFromMaterial] = useState('')
  const [loading, setLoading] = useState(true)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getLearningInsights()
      .then((value) => { if (active) setInsights(value) })
      .catch(() => { if (active) setError('Không thể tải dữ liệu học tập.') })
      .finally(() => { if (active) setLoading(false) })
    getStudyMaterials().then((items) => { if (active) setMaterials(items) }).catch(() => {})
    return () => { active = false }
  }, [])

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = question.trim()
    if (!message || asking) return
    setAsking(true)
    setError('')
    try {
      setAnswer(await askLearningAgent(message, materialId || undefined))
      setAnsweredFromMaterial(materialId)
      setQuestion('')
    } catch {
      setError('Trợ lý hiện chưa thể trả lời. Hãy thử lại sau hoặc kiểm tra với giảng viên.')
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <StudentTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="mx-auto max-w-5xl space-y-6">
            <header className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-50 p-3 text-blue-600"><BookOpenCheck size={22} /></span>
              <div>
                <h1 className="text-xl font-bold text-slate-950">Trợ lý học tập</h1>
                <p className="text-sm text-slate-500">Phân tích kết quả đã công bố để gợi ý nội dung ôn tập.</p>
              </div>
            </header>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-950">Chủ đề cần chú ý</h2>
              {loading && <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>}
              {!loading && insights && (
                <>
                  <p className="mt-1 text-sm text-slate-500">Dựa trên {insights.analyzedAttemptCount} lượt thi đủ điều kiện xem lại.
                    {insights.limitedToRecentAttempts && ' Chỉ tính các lượt gần đây.'}
                  </p>
                  {insights.topics.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">Chưa đủ dữ liệu từ kết quả được phép xem lại để xác định chủ đề yếu. Bạn vẫn có thể chọn tài liệu lớp học để hỏi và ôn tập.</p>
                  ) : (
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {insights.topics.map((topic) => (
                        <div key={topic.topicId} className="rounded-xl border border-slate-200 p-4">
                          <div className="flex items-center justify-between gap-2">
                            <p className="font-semibold text-slate-900">{topic.name}</p>
                            <span className="text-sm font-bold text-blue-700">{topic.percentage}%</span>
                          </div>
                          <p className="mt-1 text-xs text-slate-500">{topic.questionCount} câu · {topic.sufficientData ? 'Đủ dữ liệu để tham khảo' : 'Chưa đủ dữ liệu để kết luận'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="font-semibold text-slate-950">Hỏi trợ lý</h2>
              <p className="mt-1 text-sm text-slate-500">Chọn tài liệu lớp học để hỏi về nội dung ôn tập, hoặc hỏi về kết quả đã được công bố.</p>
              <form onSubmit={(event) => void ask(event)} className="mt-4 space-y-3">
                <label className="block text-sm font-medium text-slate-700" htmlFor="study-material">Tài liệu tham khảo</label>
                <select id="study-material" value={materialId} onChange={(event) => setMaterialId(event.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
                  <option value="">Chỉ phân tích kết quả được phép xem</option>
                  {materials.map((material) => <option key={material.id} value={material.id}>
                    {material.courseOffering.subject.name} · {material.title || material.fileName}
                  </option>)}
                </select>
                <div className="flex gap-2">
                <input value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={500}
                  aria-label="Câu hỏi cho trợ lý học tập" placeholder="Nhập câu hỏi về kết quả học tập..."
                  className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500" />
                <button type="submit" disabled={asking || !question.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  <Send size={16} /> {asking ? 'Đang phân tích...' : 'Gửi'}
                </button>
                </div>
              </form>
              {error && <p role="alert" className="mt-3 text-sm text-red-600">{error}</p>}
              {answer && <div className="mt-5 rounded-xl bg-blue-50 p-4 text-sm">
                <p className="font-medium text-slate-900">{answer.summary}</p>
                {answer.actions.length > 0 && <ul className="mt-3 list-disc space-y-1 pl-5">{answer.actions.map((action, index) => <li key={index}>{action}</li>)}</ul>}
                {answer.caveat && <p className="mt-3 text-slate-600">{answer.caveat}</p>}
                {answeredFromMaterial && answer.evidenceIds.includes(answeredFromMaterial) &&
                  <p className="mt-3 text-xs text-blue-800">Nguồn: {materials.find((item) => item.id === answeredFromMaterial)?.title
                    || materials.find((item) => item.id === answeredFromMaterial)?.fileName}</p>}
                <p className="mt-3 text-xs text-slate-500">Đề xuất AI chỉ để tham khảo; hãy đối chiếu với giảng viên và tài liệu môn học.</p>
              </div>}
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}
