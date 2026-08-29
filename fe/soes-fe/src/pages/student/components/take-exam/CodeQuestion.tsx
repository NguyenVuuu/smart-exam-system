import { Code2, Play } from 'lucide-react'
import { lazy, Suspense } from 'react'
import type {
  QuestionAnswer,
  TakeExamQuestion,
} from '../../types/take-exam.types'
import type { RunCodeResponse } from '../../api/student-take-exam.api'
import CodeRunResult from './code-editor/CodeRunResult'

const ProgrammingCodeEditor = lazy(() => import('./code-editor/ProgrammingCodeEditor'))
const EDITOR_FALLBACK_HEIGHT = 'clamp(420px, 58vh, 620px)'

interface CodeQuestionProps {
  question: TakeExamQuestion
  value: QuestionAnswer | undefined
  onChange: (value: string) => void
  onRun: (sourceCode: string) => void
  isRunning: boolean
  runResult: RunCodeResponse | null
  runError: string | null
  blockRightClick: boolean
}

export default function CodeQuestion({
  question,
  value,
  onChange,
  onRun,
  isRunning,
  runResult,
  runError,
  blockRightClick,
}: CodeQuestionProps) {
  const codeValue = typeof value === 'string' ? value : question.starterCode ?? ''
  const language = question.language ?? 'JAVA'
  const editorId = `code-answer-${question.id}`
  const canRun = codeValue.trim().length > 0 && !isRunning

  function handleRun() {
    if (canRun) onRun(codeValue)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={editorId} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <Code2 size={15} className="text-purple-600" aria-hidden="true" />
          Mã nguồn trả lời
        </label>

        <button
          type="button"
          onClick={handleRun}
          disabled={!canRun}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Play size={14} aria-hidden="true" />
          {isRunning ? 'Đang chạy...' : 'Chạy thử'}
        </button>
      </div>

      <Suspense
        fallback={
          <div
            className="take-exam-code__monaco flex items-center justify-center rounded-2xl border border-slate-800 bg-slate-950 text-xs font-semibold text-slate-400"
            style={{ height: EDITOR_FALLBACK_HEIGHT }}
          >
            Đang tải editor...
          </div>
        }
      >
        <ProgrammingCodeEditor
          id={editorId}
          language={language}
          value={codeValue}
          onChange={onChange}
          onRun={handleRun}
          isRunning={isRunning}
          blockRightClick={blockRightClick}
        />
      </Suspense>

      {runError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600" role="alert">
          {runError}
        </div>
      )}

      {runResult && <CodeRunResult result={runResult} />}
    </div>
  )
}
