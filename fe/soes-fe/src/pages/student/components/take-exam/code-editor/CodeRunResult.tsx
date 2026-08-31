import { CheckCircle2, ChevronDown, XCircle } from 'lucide-react'
import type { RunCodeResponse } from '../../../api/student-take-exam.api'

interface CodeRunResultProps {
  result: RunCodeResponse
}

const STATUS_LABELS: Record<string, string> = {
  PASSED: 'Đạt',
  WRONG_ANSWER: 'Sai kết quả',
  RUNTIME_ERROR: 'Lỗi runtime',
  TIME_LIMIT_EXCEEDED: 'Vượt thời gian',
  MEMORY_LIMIT_EXCEEDED: 'Vượt bộ nhớ',
  SYSTEM_ERROR: 'Lỗi hệ thống',
}

export default function CodeRunResult({ result }: CodeRunResultProps) {
  const isCompileError = result.compilationStatus === 'COMPILE_ERROR'
  const isAllPassed = result.summary.totalCount > 0 && result.summary.passedCount === result.summary.totalCount

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
            Kết quả chạy thử
          </span>
          <p className="mt-1 text-sm font-semibold text-slate-800">
            {result.summary.message}
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            isCompileError
              ? 'bg-red-100 text-red-700'
              : isAllPassed
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-amber-100 text-amber-700'
          }`}
        >
          {isCompileError ? 'Lỗi biên dịch' : `${result.summary.passedCount}/${result.summary.totalCount} test đạt`}
        </span>
      </div>

      {isCompileError && result.compilerOutput && (
        <pre className="overflow-x-auto rounded-xl border border-red-200 bg-slate-950 px-4 py-3 font-mono text-[11px] leading-5 text-red-300">
          {result.compilerOutput}
        </pre>
      )}

      {result.runtimeError && (
        <pre className="overflow-x-auto rounded-xl border border-amber-200 bg-slate-950 px-4 py-3 font-mono text-[11px] leading-5 text-amber-300">
          {result.runtimeError}
        </pre>
      )}

      {!isCompileError && (
        <ul className="space-y-2">
          {result.testCases.map((testCase, index) => {
            const passed = testCase.status === 'PASSED'
            return (
              <li key={testCase.testCaseId} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 px-3 py-2 text-xs">
                  {passed ? (
                    <CheckCircle2 size={14} className="shrink-0 text-emerald-600" aria-hidden="true" />
                  ) : (
                    <XCircle size={14} className="shrink-0 text-red-500" aria-hidden="true" />
                  )}
                  <span className="font-semibold text-slate-700">
                    Test công khai {index + 1}
                  </span>
                  <span className={passed ? 'text-emerald-600' : 'text-red-500'}>
                    {STATUS_LABELS[testCase.status] ?? testCase.status}
                  </span>
                  <ChevronDown size={14} className="ml-auto shrink-0 text-slate-400" aria-hidden="true" />
                </div>

                <div className="grid gap-2 border-t border-slate-100 px-3 py-3 font-mono text-[11px] leading-5 text-slate-600 sm:grid-cols-3">
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="font-sans font-semibold text-slate-400">Input</p>
                      <pre className="whitespace-pre-wrap">{testCase.input}</pre>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="font-sans font-semibold text-slate-400">Kỳ vọng</p>
                      <pre className="whitespace-pre-wrap">{testCase.expectedOutput}</pre>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-2">
                      <p className="font-sans font-semibold text-slate-400">Kết quả</p>
                      <pre className={`whitespace-pre-wrap ${passed ? 'text-emerald-600' : 'text-red-500'}`}>
                        {testCase.actualOutput ?? '—'}
                      </pre>
                    </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
