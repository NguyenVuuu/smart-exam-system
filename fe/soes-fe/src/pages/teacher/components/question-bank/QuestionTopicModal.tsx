import { Plus, Sparkles, Tags, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getApiErrorMessage } from '../../../../api/errors'
import { assignQuestionTopics, createLearningTopic, getLearningTopics, type LearningTopic } from '../../api/teacher-questions.api'
import type { Question } from '../../types/teacher-question-bank.types'
import { suggestQuestionTopic, type TopicSuggestion } from '../../api/teacher-ai-exam.api'

interface Props {
  question: Question | null
  onClose: () => void
  onSaved?: () => Promise<unknown>
  onDraftSaved?: (topics: LearningTopic[]) => void
}

export default function QuestionTopicModal(props: Props) {
  if (!props.question) return null
  return <QuestionTopicModalContent key={props.question.id} {...props} question={props.question} />
}

function QuestionTopicModalContent({ question, onClose, onSaved, onDraftSaved }: Props & { question: Question }) {
  const [topics, setTopics] = useState<LearningTopic[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>(() => question.topics?.map((topic) => topic.id) ?? [])
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [suggesting, setSuggesting] = useState(false)
  const [suggestion, setSuggestion] = useState<TopicSuggestion | null>(null)

  useEffect(() => {
    let active = true
    getLearningTopics(question.subjectId)
      .then((items) => { if (active) setTopics(items) })
      .catch((cause) => { if (active) setError(getApiErrorMessage(cause, 'Không thể tải danh sách chủ đề.')) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [question.subjectId])

  const toggle = (id: string) => setSelectedIds((current) =>
    current.includes(id) ? current.filter((value) => value !== id) : [...current, id])

  const addTopic = async () => {
    if (code.trim().length < 2 || name.trim().length < 3 || saving) return
    setSaving(true)
    setError('')
    try {
      const created = await createLearningTopic(question.subjectId, { code, name })
      setTopics((current) => [...current, created].sort((a, b) => a.code.localeCompare(b.code)))
      setSelectedIds((current) => [...current, created.id])
      setCode('')
      setName('')
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Không thể tạo chủ đề.'))
    } finally {
      setSaving(false)
    }
  }

  const askSuggestion = async () => {
    if (suggesting) return
    setSuggesting(true)
    setError('')
    try {
      setSuggestion(await suggestQuestionTopic({ subjectId: question.subjectId,
        title: question.title, content: question.content }))
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Không thể gợi ý chủ đề.'))
    } finally {
      setSuggesting(false)
    }
  }

  const save = async () => {
    if (saving || loading) return
    setSaving(true)
    setError('')
    try {
      if (onDraftSaved) onDraftSaved(topics.filter((topic) => selectedIds.includes(topic.id)))
      else {
        await assignQuestionTopics(question.id, selectedIds)
        await onSaved?.()
      }
      onClose()
    } catch (cause) {
      setError(getApiErrorMessage(cause, 'Không thể gắn chủ đề cho câu hỏi.'))
    } finally {
      setSaving(false)
    }
  }

  return <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4" role="presentation">
    <section role="dialog" aria-modal="true" aria-labelledby="question-topic-title"
      className="w-full max-w-xl rounded-2xl bg-white shadow-xl">
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 p-5">
        <div>
          <div className="flex items-center gap-2 text-blue-700"><Tags size={18} /><h2 id="question-topic-title" className="font-semibold">Gắn chủ đề câu hỏi</h2></div>
          <p className="mt-1 line-clamp-2 text-sm text-slate-600">{question.title}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Đóng" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
      </div>

      <div className="max-h-[70vh] space-y-5 overflow-y-auto p-5">
        <div>
          <p className="text-sm font-semibold text-slate-900">{question.subjectName}</p>
          <p className="mt-1 text-xs text-slate-500">{onDraftSaved
            ? 'Chủ đề sẽ được lưu cùng câu hỏi sau khi bạn duyệt bản nháp.'
            : 'Chủ đề mới áp dụng khi thêm câu hỏi vào đề sau lần lưu này; dữ liệu đề cũ không đổi.'}</p>
          <button type="button" onClick={() => void askSuggestion()} disabled={loading || suggesting}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 hover:bg-violet-100 disabled:opacity-50">
            <Sparkles size={16} /> {suggesting ? 'Đang gợi ý...' : 'AI gợi ý chủ đề'}
          </button>
          {suggestion && <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50 p-3 text-sm">
            <p className="text-slate-700">{suggestion.rationale}</p>
            {suggestion.existing.length > 0 && <button type="button"
              onClick={() => setSelectedIds((current) => Array.from(new Set([...current, ...suggestion.existing.map((topic) => topic.id)])))}
              className="mt-2 font-semibold text-violet-700 hover:underline">
              Chọn {suggestion.existing.map((topic) => topic.name).join(', ')}
            </button>}
            {suggestion.proposed && <button type="button"
              onClick={() => { setCode(suggestion.proposed!.code); setName(suggestion.proposed!.name) }}
              className="mt-2 block font-semibold text-violet-700 hover:underline">
              Điền chủ đề mới: {suggestion.proposed.name} (cần bấm Thêm để tạo)
            </button>}
          </div>}
          {loading && <p className="mt-3 text-sm text-slate-500">Đang tải chủ đề...</p>}
          {!loading && topics.length === 0 && <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">Môn học chưa có chủ đề. Hãy thêm chủ đề ở bên dưới.</p>}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {topics.map((topic) => <label key={topic.id} className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-3 hover:border-blue-300">
              <input type="checkbox" checked={selectedIds.includes(topic.id)} onChange={() => toggle(topic.id)}
                className="mt-1 accent-blue-600" />
              <span className="min-w-0 text-sm"><strong className="block text-slate-900">{topic.name}</strong><span className="text-xs text-slate-500">{topic.code}</span></span>
            </label>)}
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          <p className="text-sm font-semibold text-slate-900">Thêm chủ đề mới</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <input aria-label="Mã chủ đề" placeholder="Mã, ví dụ JOIN" maxLength={32} value={code} onChange={(event) => setCode(event.target.value)}
              className="w-32 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <input aria-label="Tên chủ đề" placeholder="Tên chủ đề" maxLength={120} value={name} onChange={(event) => setName(event.target.value)}
              className="min-w-44 flex-1 rounded-xl border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" />
            <button type="button" onClick={() => void addTopic()} disabled={saving || code.trim().length < 2 || name.trim().length < 3}
              className="inline-flex items-center gap-1 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50">
              <Plus size={16} /> Thêm
            </button>
          </div>
        </div>
        {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-slate-100 p-5">
        <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Hủy</button>
        <button type="button" onClick={() => void save()} disabled={saving || loading || selectedIds.length > 10}
          className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu chủ đề'}</button>
      </div>
    </section>
  </div>
}
