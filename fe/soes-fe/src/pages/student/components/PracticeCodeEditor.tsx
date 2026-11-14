import Editor, { type OnMount } from '@monaco-editor/react'
import { useEffect, useRef } from 'react'
import type { ProgrammingPracticeItem } from '../api/student-learning.api'
import { MONACO_LANGUAGE_IDS, registerProgrammingCompletions } from './take-exam/code-editor/programming-completions'

let registration: { users: number; dispose: () => void } | null = null

function acquireCompletions(monaco: Parameters<typeof registerProgrammingCompletions>[0]) {
  if (!registration) registration = { users: 0, dispose: registerProgrammingCompletions(monaco) }
  registration.users += 1
  let released = false
  return () => {
    if (!registration || released) return
    released = true
    registration.users -= 1
    if (registration.users === 0) { registration.dispose(); registration = null }
  }
}

export default function PracticeCodeEditor({ item, value, onChange }: {
  item: ProgrammingPracticeItem; value: string; onChange: (value: string) => void
}) {
  const disposeCompletions = useRef<(() => void) | null>(null)
  useEffect(() => () => disposeCompletions.current?.(), [])

  const handleMount: OnMount = (_editor, monaco) => {
    disposeCompletions.current?.()
    disposeCompletions.current = acquireCompletions(monaco)
  }

  return <div className="overflow-hidden rounded-xl border border-slate-200">
    <div className="bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200">{item.language} · Mã nguồn của bạn</div>
    <Editor height="320px" language={MONACO_LANGUAGE_IDS[item.language]} theme="vs-dark" value={value} onMount={handleMount}
      onChange={(next) => onChange(next ?? '')} options={{ minimap: { enabled: false }, fontSize: 14,
        automaticLayout: true, scrollBeyondLastLine: false, quickSuggestions: true,
        suggestOnTriggerCharacters: true, autoClosingBrackets: 'languageDefined',
        autoClosingQuotes: 'languageDefined' }} />
  </div>
}
