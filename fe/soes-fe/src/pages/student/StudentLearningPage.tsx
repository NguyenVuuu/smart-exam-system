import { BookOpenCheck, FileText, MessageCircle, Send, Sparkles, Target } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import AgentConversationHistory, { type AgentConversationSummary, type AgentConversationTurn } from '../../components/common/AgentConversationHistory'
import { getApiErrorMessage } from '../../api/errors'
import { askLearningAgent, getLearningConversation, getLearningInsights, getStudyMaterials, listLearningConversations, type LearningAnswer, type StudentLearningInsights, type StudyMaterial } from './api/student-learning.api'
import StudentSidebar from './components/StudentSidebar'
import StudentTopBar from './components/StudentTopBar'
import StudentPracticePanel from './components/StudentPracticePanel'
import StudentMaterialPicker from './components/StudentMaterialPicker'

type LearningTab = 'ask' | 'practice' | 'topics'

export default function StudentLearningPage() {
  const [activeTab, setActiveTab] = useState<LearningTab>('ask')
  const [insights, setInsights] = useState<StudentLearningInsights | null>(null)
  const [conversationId, setConversationId] = useState('')
  const conversationRequest = useRef(0)
  const [conversations, setConversations] = useState<AgentConversationSummary[]>([])
  const [turns, setTurns] = useState<AgentConversationTurn<LearningAnswer>[]>([])
  const [question, setQuestion] = useState('')
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [materialsError, setMaterialsError] = useState(false)
  const [askMode, setAskMode] = useState<'material' | 'results'>('material')
  const [subjectId, setSubjectId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [loading, setLoading] = useState(true)
  const [insightsError, setInsightsError] = useState(false)
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    conversationRequest.current += 1
    let active = true
    getLearningInsights()
      .then((value) => { if (active) setInsights(value) })
      .catch(() => { if (active) setInsightsError(true) })
      .finally(() => { if (active) setLoading(false) })
    getStudyMaterials().then((items) => { if (active) setMaterials(items) })
      .catch(() => { if (active) setMaterialsError(true) })
    return () => { active = false }
  }, [])

  useEffect(() => {
    setConversationId('')
    setTurns([])
    if (askMode === 'material' && !materialId) { setConversations([]); return }
    let active = true
    listLearningConversations(askMode === 'material' ? materialId : undefined)
      .then((items) => { if (active) setConversations(items) })
      .catch(() => { if (active) setError('Không thể tải lịch sử hội thoại.') })
    return () => { active = false }
  }, [askMode, materialId])

  const selectConversation = async (id: string) => {
    const request = ++conversationRequest.current
    setConversationId(id)
    setTurns([])
    if (!id) return
    try {
      const result = await getLearningConversation(id, askMode === 'material' ? materialId : undefined)
      if (request === conversationRequest.current) setTurns(result.turns)
    } catch (cause) {
      if (request === conversationRequest.current) setError(getApiErrorMessage(cause, 'Không thể mở hội thoại.'))
    }
  }

  const ask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const message = question.trim()
    if (!message || asking || (askMode === 'material' && !materialId)) return
    setAsking(true)
    setError('')
    const request = conversationRequest.current
    try {
      const result = await askLearningAgent(message, askMode === 'material' ? materialId : undefined, conversationId || undefined)
      if (request !== conversationRequest.current) return
      setConversationId(result.conversationId)
      setTurns((current) => [...current, { id: crypto.randomUUID(), message, answer: result.answer,
        createdAt: new Date().toISOString() }])
      setQuestion('')
      void listLearningConversations(askMode === 'material' ? materialId : undefined)
        .then(setConversations).catch(() => {})
    } catch (cause) {
      if (request === conversationRequest.current) setError(getApiErrorMessage(cause, 'Trợ lý hiện chưa thể trả lời. Hãy thử lại sau.'))
    } finally {
      setAsking(false)
    }
  }

  const selectedMaterial = materials.find((item) => item.id === materialId)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 text-slate-800">
      <StudentSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <StudentTopBar />
        <main className="min-h-0 flex-1 overflow-y-auto px-6 py-7 lg:px-8">
          <div className="w-full space-y-6">
            <header className="flex items-start gap-3">
              <span className="rounded-xl bg-blue-50 p-3 text-blue-600"><BookOpenCheck size={22} /></span>
              <div>
                <h1 className="text-xl font-bold text-slate-950">Trợ lý học tập</h1>
                <p className="text-sm text-slate-500">Hỏi về tài liệu lớp học, luyện tập và xem những chủ đề cần ôn.</p>
              </div>
            </header>

            <nav className="flex flex-wrap gap-1 border-b border-slate-200" role="tablist" aria-label="Trợ lý học tập">
              {([
                ['ask', 'Hỏi trợ lý', MessageCircle],
                ['practice', 'Bài luyện', BookOpenCheck],
                ['topics', 'Chủ đề cần chú ý', Target],
              ] as const).map(([tab, label, Icon]) => <button key={tab} type="button"
                id={`learning-tab-${tab}`} role="tab" aria-selected={activeTab === tab}
                aria-controls={`learning-panel-${tab}`} onClick={() => setActiveTab(tab)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-900'}`}>
                <Icon size={17} />{label}
              </button>)}
            </nav>

            {materialsError && activeTab !== 'topics' && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Không thể tải tài liệu lớp học. Hãy tải lại trang để thử lại.
            </p>}

            <section id="learning-panel-topics" role="tabpanel" aria-labelledby="learning-tab-topics"
              className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm ${activeTab === 'topics' ? '' : 'hidden'}`}>
              <h2 className="font-semibold text-slate-950">Chủ đề cần chú ý</h2>
              {loading && <p className="mt-3 text-sm text-slate-500">Đang tải dữ liệu...</p>}
              {insightsError && <p role="alert" className="mt-3 text-sm text-red-600">Không thể tải dữ liệu kết quả học tập.</p>}
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
                          <p className="mt-1 text-xs text-slate-500">{topic.questionCount} lượt trả lời · {topic.sufficientData ? 'Đủ dữ liệu để tham khảo' : 'Chưa đủ dữ liệu để kết luận'}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>

            <section id="learning-panel-ask" role="tabpanel" aria-labelledby="learning-tab-ask"
              className={`overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ${activeTab === 'ask' ? '' : 'hidden'}`}>
              <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
                <span className="rounded-xl bg-indigo-50 p-2.5 text-indigo-600"><MessageCircle size={20} /></span>
                <div>
                  <h2 className="font-bold text-slate-950">Hỏi trợ lý</h2>
                  <p className="mt-1 text-sm text-slate-500">Đặt câu hỏi về nội dung học hoặc kết quả đã công bố của bạn.</p>
                </div>
              </div>
              <div className="space-y-5 p-5">
                <div className="inline-flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1" role="group" aria-label="Nguồn trả lời">
                  {([['material', 'Tài liệu lớp học', FileText], ['results', 'Kết quả đã công bố', Sparkles]] as const).map(([mode, label, Icon]) =>
                    <button key={mode} type="button" onClick={() => { setAskMode(mode); setError('') }}
                      aria-pressed={askMode === mode}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${askMode === mode ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}>
                      <Icon size={16} />{label}
                    </button>)}
                </div>
                {askMode === 'material' ? <StudentMaterialPicker materials={materials} subjectId={subjectId}
                  materialId={materialId} onSubjectChange={(value) => { setSubjectId(value); setMaterialId('') }}
                  onMaterialChange={setMaterialId} /> :
                  <p className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-800">Trợ lý chỉ sử dụng kết quả của bạn đã được phép xem lại.</p>}
                {!materialsError && materials.length === 0 && askMode === 'material' &&
                  <p className="text-sm text-slate-500">Chưa có tài liệu phù hợp để hỏi. Bạn có thể chọn “Kết quả đã công bố”.</p>}
                <AgentConversationHistory conversations={conversations} currentId={conversationId} turns={turns}
                  onSelect={(id) => void selectConversation(id)}
                  source={askMode === 'material' && materialId ? { id: materialId,
                    label: selectedMaterial?.title || selectedMaterial?.fileName || 'Tài liệu lớp học' } : undefined} />
                <form onSubmit={(event) => void ask(event)} className="space-y-3">
                  <label htmlFor="learning-question" className="block text-sm font-semibold text-slate-700">{askMode === 'material' ? '3. ' : ''}Câu hỏi của bạn</label>
                  <textarea id="learning-question" value={question} onChange={(event) => setQuestion(event.target.value)}
                    maxLength={500} rows={3} placeholder={askMode === 'material' ? 'Ví dụ: Giải thích sự khác nhau giữa INNER JOIN và LEFT JOIN trong tài liệu này.' : 'Ví dụ: Tôi nên ôn chủ đề nào trước?'}
                    className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs text-slate-400">{question.length}/500 ký tự</span>
                    <button type="submit" disabled={asking || !question.trim() || (askMode === 'material' && !materialId)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
                      <Send size={16} /> {asking ? 'Đang trả lời...' : 'Gửi câu hỏi'}
                    </button>
                  </div>
                </form>
                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
                {turns.length > 0 && <p className="text-xs text-slate-500">Nội dung AI chỉ để tham khảo; hãy đối chiếu với tài liệu và giảng viên.</p>}
              </div>
            </section>
            <div id="learning-panel-practice" role="tabpanel" aria-labelledby="learning-tab-practice"
              className={activeTab === 'practice' ? '' : 'hidden'}>
              <StudentPracticePanel materials={materials} topics={insights?.topics ?? []} />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
