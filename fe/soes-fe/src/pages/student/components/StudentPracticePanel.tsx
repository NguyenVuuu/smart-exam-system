import { lazy, Suspense, useEffect, useState } from 'react'
import { BookOpen, ClipboardList, Sparkles } from 'lucide-react'
import AppSelect from '../../../components/common/AppSelect'
import { getApiErrorMessage } from '../../../api/errors'
import { createPracticeSet, getPracticeSet, listPracticeSets, submitPracticeSet,
  type PracticeSet, type PracticeSummary, type StudyMaterial, type TopicInsight } from '../api/student-learning.api'
import StudentMaterialPicker from './StudentMaterialPicker'

const PracticeCodeEditor = lazy(() => import('./PracticeCodeEditor'))

export default function StudentPracticePanel({ materials, topics }: { materials: StudyMaterial[]; topics: TopicInsight[] }) {
  const [subjectId, setSubjectId] = useState('')
  const [materialId, setMaterialId] = useState('')
  const [focusTopicId, setFocusTopicId] = useState('')
  const [instruction, setInstruction] = useState('')
  const [questionCount, setQuestionCount] = useState('5')
  const [sets, setSets] = useState<PracticeSummary[]>([])
  const [current, setCurrent] = useState<PracticeSet | null>(null)
  const [choices, setChoices] = useState<Record<string, number>>({})
  const [codes, setCodes] = useState<Record<string, string>>({})
  const [page, setPage] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const weakTopics = topics.filter((topic) => topic.subjectId === subjectId && topic.needsPractice)
  const count = Number(questionCount)
  const validCount = /^\d+$/.test(questionCount) && count >= 1 && count <= 20
  const pageCount = Math.ceil((current?.items.length ?? 0) / 5)

  useEffect(() => { listPracticeSets().then(setSets).catch(() => {}) }, [])

  const open = async (id: string) => {
    setBusy(true); setError('')
    try { setCurrent(await getPracticeSet(id)); setChoices({}); setCodes({}); setPage(0) }
    catch { setError('Không thể mở bài luyện.') }
    finally { setBusy(false) }
  }

  const create = async () => {
    if (!materialId || !validCount) return
    setBusy(true); setError('')
    try {
      const next = await createPracticeSet(materialId, count, focusTopicId || undefined, instruction.trim() || undefined)
      setCurrent(next); setChoices({}); setCodes({}); setPage(0)
      listPracticeSets().then(setSets).catch(() => {})
    } catch (cause) { setError(getApiErrorMessage(cause, 'Chưa thể tạo bài luyện. Vui lòng thử lại sau.')) }
    finally { setBusy(false) }
  }

  const submit = async () => {
    if (!current || current.items.some((item) => item.kind === 'PROGRAMMING'
      ? !(codes[item.id] ?? item.starterCode).trim() : choices[item.id] === undefined)) return
    setBusy(true); setError('')
    try {
      setCurrent(await submitPracticeSet(current.id,
        current.items.map((item) => item.kind === 'PROGRAMMING'
          ? { itemId: item.id, sourceCode: codes[item.id] ?? item.starterCode }
          : { itemId: item.id, selectedIndex: choices[item.id] })))
      listPracticeSets().then(setSets).catch(() => {})
    } catch { setError('Không thể nộp bài luyện. Hãy thử lại.') }
    finally { setBusy(false) }
  }

  return <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-start gap-3 border-b border-slate-100 px-5 py-4">
      <span className="rounded-xl bg-violet-50 p-2.5 text-violet-600"><BookOpen size={20} /></span>
      <div>
        <h2 className="font-bold text-slate-950">Bài luyện từ tài liệu lớp học</h2>
        <p className="mt-1 text-sm text-slate-500">Chọn tài liệu, mô tả nội dung muốn luyện và số câu phù hợp.</p>
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
          maxLength={500} rows={3} placeholder="Ví dụ: Dự đoán kết quả đoạn mã Java (trắc nghiệm), hoặc viết chương trình Java tính tổng dãy số (chạy Judge)."
          className="w-full resize-y rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
        <p className="text-right text-xs text-slate-400">{instruction.length}/500 ký tự</p>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4 rounded-xl bg-slate-50 px-4 py-4">
        <div className="space-y-2">
          <label htmlFor="practice-count" className="block text-sm font-semibold text-slate-700">Số câu muốn tạo</label>
          <input id="practice-count" type="number" min={1} max={20} step={1} inputMode="numeric"
            value={questionCount} onChange={(event) => setQuestionCount(event.target.value)}
            aria-invalid={!validCount} aria-describedby="practice-count-hint"
            className="h-11 w-32 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" />
          <p id="practice-count-hint" className="text-xs text-slate-500">Từ 1 đến 20 câu</p>
        </div>
        <button type="button" disabled={!materialId || !validCount || busy} onClick={() => void create()}
          className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">
          <Sparkles size={16} />{busy ? 'Đang tạo bài...' : `Tạo ${count} câu ôn tập`}
        </button>
      </div>
      <p className="text-xs text-slate-500">Bài luyện không tính vào điểm hoặc lượt thi chính thức. Đối chiếu đáp án với tài liệu sau khi nộp.</p>
    {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    {sets.length > 0 && <div className="space-y-2 border-t border-slate-100 pt-5">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800"><ClipboardList size={17} /> Lịch sử bài luyện</h3>
      <AppSelect value={current?.id ?? ''} options={sets.map((set) => ({
        value: set.id,
        label: `${set.subject.name} · ${new Date(set.createdAt).toLocaleString('vi-VN')} · ${set.completedAt ? `${set.score}/${set._count.items} câu đúng` : 'Chưa nộp'}`,
      }))} onChange={(id) => void open(id)} disabled={busy} placeholder="Chọn bài luyện để xem lại"
        ariaLabel="Chọn bài luyện trong lịch sử" className="w-full sm:max-w-xl"
        buttonClassName="h-11 border-slate-200" />
      <p className="text-xs text-slate-500">Chọn bài chưa nộp để làm tiếp hoặc bài đã nộp để xem đáp án và giải thích.</p>
    </div>}
    {current && <div className="space-y-4">
      {current.completedAt && <p className="font-semibold text-blue-700">Kết quả: {current.score}/{current.items.length} câu đúng</p>}
      {current.items.slice(page * 5, (page + 1) * 5).map((item) => <fieldset key={item.id} className="space-y-2 rounded-xl border border-slate-200 p-4">
        <legend className="whitespace-pre-wrap px-1 font-medium text-slate-900">Câu {item.orderIndex}: {item.stem}</legend>
        {item.kind === 'CHOICE' ? item.options.map((option, index) => <label key={index} className="flex items-start gap-2 text-sm text-slate-700">
          <input type="radio" name={item.id} checked={(item.result?.selectedIndex ?? choices[item.id]) === index}
            disabled={!!current.completedAt || busy} onChange={() => setChoices((previous) => ({ ...previous, [item.id]: index }))} />
          {option}{item.result?.correctIndex === index && <span className="font-semibold text-emerald-700">(Đáp án)</span>}
        </label>) : <div className="space-y-3">
          <p className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">Ví dụ đầu vào: <code>{item.sampleInput}</code><br />Ví dụ đầu ra: <code>{item.sampleOutput}</code></p>
          {current.completedAt ? <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{item.result?.sourceCode}</pre>
            : <Suspense fallback={<p className="text-sm text-slate-500">Đang mở trình soạn mã...</p>}>
              <PracticeCodeEditor item={item} value={codes[item.id] ?? item.starterCode}
                onChange={(value) => setCodes((previous) => ({ ...previous, [item.id]: value }))} />
            </Suspense>}
          {item.result && <p className="text-sm font-semibold text-blue-700">Qua {item.result.passedTestCases}/{item.result.totalTestCases} test case</p>}
        </div>}
        {item.result && <div className="space-y-1 text-xs text-slate-600">
          <p>{item.result.explanation}</p>
          <p>Nguồn: {item.result.materialTitle || 'Tài liệu lớp học'} · “{item.result.supportQuote}”</p>
        </div>}
      </fieldset>)}
      {pageCount > 1 && <nav aria-label="Trang bài luyện" className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <button type="button" disabled={page === 0} onClick={() => setPage((value) => value - 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40">Trước</button>
        <span className="text-sm text-slate-600">Trang {page + 1}/{pageCount} · Đã trả lời {current.items.filter((item) => item.kind === 'PROGRAMMING' ? !!(codes[item.id] ?? item.starterCode).trim() : choices[item.id] !== undefined).length}/{current.items.length}</span>
        <button type="button" disabled={page >= pageCount - 1} onClick={() => setPage((value) => value + 1)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40">Tiếp</button>
      </nav>}
      {!current.completedAt && <button type="button" disabled={busy || current.items.some((item) => item.kind === 'PROGRAMMING' ? !(codes[item.id] ?? item.starterCode).trim() : choices[item.id] === undefined)}
        onClick={() => void submit()} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">Nộp bài luyện</button>}
    </div>}
    </div>
  </section>
}
