import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { Braces, WandSparkles } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { TakeExamLanguage } from '../../../types/take-exam.types'

interface ProgrammingCodeEditorProps {
  id: string
  language: TakeExamLanguage
  value: string
  onChange: (value: string) => void
  onRun: () => void
  isRunning: boolean
  blockRightClick: boolean
}

const LANGUAGE_LABELS: Record<TakeExamLanguage, string> = {
  C: 'C',
  CPP: 'C++',
  JAVA: 'Java',
  PYTHON: 'Python',
}

const MONACO_LANGUAGES: Record<TakeExamLanguage, string> = {
  C: 'c',
  CPP: 'cpp',
  JAVA: 'java',
  PYTHON: 'python',
}

const FILE_EXTENSIONS: Record<TakeExamLanguage, string> = {
  C: 'c',
  CPP: 'cpp',
  JAVA: 'java',
  PYTHON: 'py',
}

const EDITOR_HEIGHT = 'clamp(420px, 58vh, 620px)'

export default function ProgrammingCodeEditor({
  id,
  language,
  value,
  onChange,
  onRun,
  isRunning,
  blockRightClick,
}: ProgrammingCodeEditorProps) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)
  const isRunningRef = useRef(isRunning)
  const onRunRef = useRef(onRun)
  const valueRef = useRef(value)

  useEffect(() => {
    isRunningRef.current = isRunning
    onRunRef.current = onRun
    valueRef.current = value
  }, [isRunning, onRun, value])

  const handleBeforeMount: BeforeMount = (monaco) => {
    monaco.editor.defineTheme('soes-exam-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7dd3fc', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c4b5fd' },
        { token: 'number', foreground: 'fbbf24' },
        { token: 'string', foreground: '86efac' },
      ],
      colors: {
        'editor.background': '#020617',
        'editor.foreground': '#e2e8f0',
        'editorCursor.foreground': '#60a5fa',
        'editorLineNumber.foreground': '#64748b',
        'editorLineNumber.activeForeground': '#bfdbfe',
        'editor.selectionBackground': '#2563eb55',
        'editor.inactiveSelectionBackground': '#33415566',
        'editorIndentGuide.background1': '#1e293b',
        'editorIndentGuide.activeBackground1': '#475569',
        'editor.lineHighlightBackground': '#0f172a',
      },
    })
  }

  const handleMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (!isRunningRef.current && valueRef.current.trim().length > 0) {
        onRunRef.current()
      }
    })
  }

  async function handleFormat() {
    const editor = editorRef.current
    if (!editor) return

    await editor.getAction('editor.action.formatDocument')?.run()
    onChange(editor.getValue())
  }

  return (
    <div className="take-exam-code overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-slate-900 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="h-2 w-2 shrink-0 rounded-full bg-rose-400" aria-hidden="true" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-hidden="true" />
          <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400" aria-hidden="true" />
          <span className="truncate font-mono text-[11px] font-medium text-slate-400">
            Solution.{FILE_EXTENSIONS[language]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[11px] font-semibold text-slate-300">
            {LANGUAGE_LABELS[language]}
          </span>
          <button
            type="button"
            onClick={handleFormat}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition-colors hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/40"
            title="Format document"
            aria-label="Format document"
          >
            <WandSparkles size={14} aria-hidden="true" />
          </button>
        </div>
      </div>

      <div id={id} className="take-exam-code__monaco" style={{ height: EDITOR_HEIGHT }}>
        <Editor
          height={EDITOR_HEIGHT}
          language={MONACO_LANGUAGES[language]}
          theme="soes-exam-dark"
          value={value}
          beforeMount={handleBeforeMount}
          onMount={handleMount}
          onChange={(nextValue) => onChange(nextValue ?? '')}
          loading={
            <div className="flex h-full items-center justify-center gap-2 bg-slate-950 text-xs font-semibold text-slate-400">
              <Braces size={16} aria-hidden="true" />
              Đang tải editor...
            </div>
          }
          options={{
            autoClosingBrackets: 'languageDefined',
            autoClosingQuotes: 'languageDefined',
            autoIndent: 'advanced',
            automaticLayout: true,
            bracketPairColorization: { enabled: true },
            contextmenu: !blockRightClick,
            cursorBlinking: 'smooth',
            detectIndentation: true,
            fixedOverflowWidgets: true,
            fontFamily: 'Cascadia Code, Consolas, monospace',
            fontLigatures: false,
            fontSize: 13,
            formatOnPaste: true,
            formatOnType: true,
            guides: {
              bracketPairs: true,
              indentation: true,
            },
            lineHeight: 24,
            lineNumbers: 'on',
            minimap: { enabled: false },
            padding: { top: 14, bottom: 14 },
            renderLineHighlight: 'all',
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            tabSize: 4,
            wordWrap: 'off',
          }}
        />
      </div>
    </div>
  )
}
