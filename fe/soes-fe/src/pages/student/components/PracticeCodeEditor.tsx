import Editor from '@monaco-editor/react'
import type { ProgrammingPracticeItem } from '../api/student-learning.api'

const languages = { C: 'c', CPP: 'cpp', JAVA: 'java' } as const

export default function PracticeCodeEditor({ item, value, onChange }: {
  item: ProgrammingPracticeItem; value: string; onChange: (value: string) => void
}) {
  return <div className="overflow-hidden rounded-xl border border-slate-200">
    <div className="bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200">{item.language} · Mã nguồn của bạn</div>
    <Editor height="320px" language={languages[item.language]} theme="vs-dark" value={value}
      onChange={(next) => onChange(next ?? '')} options={{ minimap: { enabled: false }, fontSize: 14,
        automaticLayout: true, scrollBeyondLastLine: false }} />
  </div>
}
