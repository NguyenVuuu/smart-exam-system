import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../api/errors'
import { createPracticeSet, getPracticeSet, listPracticeSets, submitPracticeSet,
  type PracticeSet, type PracticeSummary, type StudyMaterial } from '../api/student-learning.api'

export default function StudentPracticePanel({ materials }: { materials: StudyMaterial[] }) {
  const [materialId, setMaterialId] = useState('')
  const [sets, setSets] = useState<PracticeSummary[]>([])
  const [current, setCurrent] = useState<PracticeSet | null>(null)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

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
      const next = await createPracticeSet(materialId)
      setCurrent(next); setChoices({})
      setSets(await listPracticeSets())
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

  return <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div>
      <h2 className="font-semibold text-slate-950">Bài luyện từ tài liệu lớp học</h2>
      <p className="mt-1 text-sm text-slate-500">Bài luyện này tách khỏi điểm và lượt thi chính thức. Câu hỏi do AI tạo nên hãy kiểm tra lại với tài liệu.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <select aria-label="Tài liệu tạo bài luyện" value={materialId} onChange={(event) => setMaterialId(event.target.value)}
        className="min-w-0 flex-1 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm">
        <option value="">Chọn tài liệu</option>
        {materials.map((material) => <option key={material.id} value={material.id}>{material.title || material.fileName}</option>)}
      </select>
      <button type="button" disabled={!materialId || busy} onClick={() => void create()}
        className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Tạo 5 câu ôn tập</button>
    </div>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {sets.length > 0 && <div className="flex flex-wrap gap-2">
      {sets.map((set) => <button key={set.id} type="button" onClick={() => void open(set.id)}
        className="rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700">
        {set.subject.name} · {new Date(set.createdAt).toLocaleDateString('vi-VN')} · {set.completedAt ? `${set.score}/${set._count.items}` : 'Chưa nộp'}
      </button>)}
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
  </section>
}
