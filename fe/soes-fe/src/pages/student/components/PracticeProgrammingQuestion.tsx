import { lazy, Suspense, useState } from 'react'
import { Play } from 'lucide-react'
import AgentAnswerMarkdown from '../../../components/common/AgentAnswerMarkdown'
import { getApiErrorMessage } from '../../../api/errors'
import { runPracticeSample, type PracticeSampleResult, type ProgrammingPracticeItem } from '../api/student-learning.api'

const PracticeCodeEditor = lazy(() => import('./PracticeCodeEditor'))

export default function PracticeProgrammingQuestion({ setId, item, value, onChange, completed }: {
  setId: string; item: ProgrammingPracticeItem; value: string
  onChange: (value: string) => void; completed: boolean
}) {
  const [result, setResult] = useState<PracticeSampleResult | null>(null)
  const [error, setError] = useState('')
  const [running, setRunning] = useState(false)

  const run = async () => {
    setRunning(true); setError(''); setResult(null)
    try { setResult(await runPracticeSample(setId, item.id, value)) }
    catch (cause) { setError(getApiErrorMessage(cause, 'Không thể chạy thử. Hãy thử lại.')) }
    finally { setRunning(false) }
  }

  return <div className="space-y-3">
    <div className="space-y-3 rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      <div>
        <p className="mb-1 font-semibold">Ví dụ đầu vào:</p>
        <pre aria-label="Ví dụ đầu vào" className="overflow-x-auto whitespace-pre-wrap break-words font-mono">{item.sampleInput}</pre>
      </div>
      <div>
        <p className="mb-1 font-semibold">Ví dụ đầu ra:</p>
        <pre aria-label="Ví dụ đầu ra" className="overflow-x-auto whitespace-pre-wrap break-words font-mono">{item.sampleOutput}</pre>
      </div>
    </div>
    {completed ? <pre className="overflow-x-auto rounded-xl bg-slate-950 p-4 text-xs text-slate-100">{item.result?.sourceCode}</pre>
      : <Suspense fallback={<p className="text-sm text-slate-500">Đang mở trình soạn mã...</p>}>
        <PracticeCodeEditor item={item} value={value} onChange={(next) => { onChange(next); setResult(null) }} />
      </Suspense>}
    {!completed && <button type="button" disabled={!value.trim() || running} onClick={() => void run()}
      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
      <Play size={15} />{running ? 'Đang chạy thử...' : 'Chạy thử ví dụ'}
    </button>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {result && <div role="status" className={`rounded-lg border p-3 text-sm ${result.passed ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
      <p className="font-semibold">{result.passed ? 'Đúng với ví dụ' : `Chưa đúng với ví dụ · ${result.status}`}</p>
      <p>Đầu ra của bạn:</p><pre className="overflow-x-auto whitespace-pre-wrap">{result.output || '(Không có đầu ra)'}</pre>
      {result.error && <pre className="overflow-x-auto whitespace-pre-wrap text-red-700">{result.error}</pre>}
    </div>}
    {item.result && <p className="text-sm font-semibold text-blue-700">Qua {item.result.passedTestCases}/{item.result.totalTestCases} test case</p>}
    {completed && item.result && <section aria-label="Thuật toán và cách giải tham khảo" className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
      <h3 className="mb-2 font-semibold text-slate-800">Thuật toán và cách giải tham khảo</h3>
      <AgentAnswerMarkdown text={item.result.explanation} />
    </section>}
  </div>
}
