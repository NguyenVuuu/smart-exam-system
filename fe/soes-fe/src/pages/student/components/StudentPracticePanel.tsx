import { useEffect, useState } from 'react'
import { BookOpen, ClipboardList, Sparkles } from 'lucide-react'
import AppSelect from '../../../components/common/AppSelect'
import { getApiErrorMessage } from '../../../api/errors'
import { createPracticeSet, getPracticeSet, listPracticeSets, submitPracticeSet,
  type PracticeSet, type PracticeSummary, type StudyMaterial, type TopicInsight } from '../api/student-learning.api'
import StudentMaterialPicker from './StudentMaterialPicker'

export default function StudentPracticePanel({ materials, topics }: { materials: StudyMaterial[]; topics: TopicInsight[] }) {
  const [subjectId, setSubjectId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [focusTopicId, setFocusTopicId] = useState('')
  const [instruction, setInstruction] = useState('')
  const [sets, setSets] = useState<PracticeSummary[]>([])
  const [current, setCurrent] = useState<PracticeSet | null>(null)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const weakTopics = topics.filter((topic) => topic.subjectId === subjectId && topic.needsPractice)

  useEffect(() => { listPracticeSets().then(setSets).catch(() => {}) }, [])

  const open = async (id: string) => {
    setBusy(true); setError('')
    try { setCurrent(await getPracticeSet(id)); setChoices({}) }
    catch { setError('Không thể mở bài luyện.') }
    finally { setBusy(false) }
  }

  const create = async () => {
    if (!materialId) return
    setBusy(true); setError('')
    try {
      const next = await createPracticeSet(materialId, 5, focusTopicId || undefined, instruction.trim() || undefined)
      setCurrent(next); setChoices({})
      listPracticeSets().then(setSets).catch(() => {})
    } catch (cause) { setError(getApiErrorMessage(cause, 'Chưa thể tạo bài luyện. Vui lòng thử lại sau.')) }
    finally { setBusy(false) }
  }

  const submit = async () => {
    if (!current || current.items.some((item) => choices[item.id] === undefined)) return
    setBusy(true); setError('')
    try {
      setCurrent(await submitPracticeSet(current.id,
        current.items.map((item) => ({ itemId: item.id, selectedIndex: choices[item.id] }))))
      setSets(await listPracticeSets())
    } catch { setError('Không thể nộp bài luyện. Hãy thử lại.') }
    finally { setBusy(false) }
  }

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
      <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600"><BookOpen size={20} /></span>
      <div>
        <h2 className="font-bold text-slate-950">Bài luyện từ tài liệu lớp học</h2>
        <p className="mt-1 text-sm text-slate-500">Tạo 5 câu ôn tập theo tài liệu và nội dung bạn muốn luyện.</p>
      </div>
    </div>
    <div className="space-y-5 p-5">
      <StudentMaterialPicker materials={materials} subjectId={subjectId} materialId={materialId}
        onSubjectChange={(value) => { setSubjectId(value); setMaterialId(''); setFocusTopicId('') }}
        onMaterialChange={(value) => { setMaterialId(value); setFocusTopicId('') }} />
      {materials.length === 0 && <p className="text-sm text-slate-500">Chưa có tài liệu phù hợp để tạo bài luyện. Hãy kiểm tra tài liệu trong lớp học phần.</p>}
      {materialId && weakTopics.length > 0 && <div className="space-y-2">
        <span className="block text-sm font-semibold text-slate-700">Chủ đề cần ưu tiên <span className="font-normal text-slate-400">(tùy chọn)</span></span>
        <AppSelect value={focusTopicId} options={[
          { value: '', label: 'Ôn tập chung' },
          ...weakTopics.map((topic) => ({ value: topic.topicId,
            label: `${topic.name} · ${topic.percentage}% qua ${topic.questionCount} lượt trả lời` })),
        ]} onChange={setFocusTopicId} ariaLabel="Chủ đề yếu cần ưu tiên"
          buttonClassName="h-11 border-slate-200" />
      </div>}
      <div className="space-y-2">
        <label htmlFor="practice-instruction" className="block text-sm font-semibold text-slate-700">3. Bạn muốn luyện nội dung nào? <span className="font-normal text-slate-400">(tùy chọn)</span></label>
        <textarea id="practice-instruction" value={instruction} onChange={(event) => setInstruction(event.target.value)}
          maxLength={500} rows={3} placeholder="Ví dụ: Tạo câu hỏi về vòng lặp for và mảng, ưu tiên các ví dụ trong chương 2."
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <p className="text-right text-xs text-slate-400">{instruction.length}/500 ký tự</p>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
        <p className="text-xs text-slate-500">Bài luyện không tính vào điểm hoặc lượt thi chính thức. Đối chiếu đáp án với tài liệu sau khi nộp.</p>
        <button type="button" disabled={!materialId || busy} onClick={() => void create()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Sparkles size={16} />{busy ? 'Đang xử lý...' : 'Tạo 5 câu ôn tập'}
        </button>
      </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {sets.length > 0 && <div className="space-y-2 border-t border-slate-100 pt-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ClipboardList size={17} /> Bài luyện gần đây</h3>
      <div className="flex flex-wrap gap-2">
      {sets.map((set) => <button key={set.id} type="button" onClick={() => void open(set.id)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 transition hover:border-blue-300 hover:bg-blue-50">
        {set.subject.name} · {new Date(set.createdAt).toLocaleDateString('vi-VN')} · {set.completedAt ? `${set.score}/${set._count.items}` : 'Chưa nộp'}
      </button>)}
      </div>
    </div>}
    {current && <div className="space-y-4">
      {current.completedAt && <p className="font-semibold text-blue-700">Kết quả: {current.score}/{current.items.length} câu đúng</p>}
      {current.items.map((item) => <fieldset key={item.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
        <legend className="px-1 font-medium text-slate-900">Câu {item.orderIndex}: {item.stem}</legend>
        {item.options.map((option, index) => <label key={index} className="flex items-start gap-2 text-sm text-slate-700">
          <input type="radio" name={item.id} checked={(item.result?.selectedIndex ?? choices[item.id]) === index}
            disabled={!!current.completedAt || busy} onChange={() => setChoices((previous) => ({ ...previous, [item.id]: index }))} />
          {option}{item.result?.correctIndex === index && <span className="font-semibold text-emerald-700">(Đáp án)</span>}
        </label>)}
        {item.result && <div className="space-y-1 text-xs text-slate-600">
          <p>{item.result.explanation}</p>
          <p>Nguồn: {item.result.materialTitle || 'Tài liệu lớp học'} · “{item.result.supportQuote}”</p>
        </div>}
      </fieldset>)}
      {!current.completedAt && <button type="button" disabled={busy || current.items.some((item) => choices[item.id] === undefined)}
        onClick={() => void submit()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Nộp bài luyện</button>}
    </div>}
    </div>
  </section>
}
