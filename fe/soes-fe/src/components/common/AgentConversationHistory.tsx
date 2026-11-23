import AppSelect from './AppSelect'
import AgentAnswerMarkdown from './AgentAnswerMarkdown'
import { useEffect, useRef } from 'react'

export interface AgentConversationSummary {
  id: string
  updatedAt: string
  turns: Array<{ message: string }>
}

export interface AgentConversationTurn<TAnswer extends { summary: string; actions: string[]; caveat: string | null }> {
  id: string
  message: string
  answer: TAnswer
  createdAt: string
}

function usefulActions(summary: string, actions: string[]): string[] {
  const normalize = (text: string) => text.toLocaleLowerCase('vi').replace(/[*_`]/g, '').replace(/\s+/g, ' ').replace(/[.!?\s]+$/g, '').trim()
  const summaryText = normalize(summary)
  const seen = new Set<string>()
  return actions.filter((action) => {
    const text = normalize(action)
    if (!text || seen.has(text) || summaryText.includes(text)) return false
    if (/^(xin chào|chào (bạn|em)|tôi (đã sẵn sàng|có thể giúp)|bạn muốn (trao đổi|hỏi))/u.test(text)) return false
    seen.add(text)
    return true
  })
}

export default function AgentConversationHistory<TAnswer extends { summary: string; actions: string[]; caveat: string | null; evidenceIds?: string[]; sourceQuote?: string | null; sourceLocation?: string | null }>({
  conversations, currentId, turns, onSelect, source, pendingMessage, chatMode = false,
}: {
  conversations: AgentConversationSummary[]
  currentId: string
  turns: AgentConversationTurn<TAnswer>[]
  onSelect: (id: string) => void
  source?: { id: string; label: string }
  pendingMessage?: string
  chatMode?: boolean
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => { if (chatMode) bottomRef.current?.scrollIntoView({ block: 'nearest' }) }, [turns, pendingMessage, chatMode])
  return <div className="space-y-4">
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-slate-700">Hội thoại</span>
      <AppSelect value={currentId} onChange={onSelect} ariaLabel="Chọn hội thoại"
        className="min-w-52 max-w-full flex-1" options={[
          { value: '', label: 'Cuộc trò chuyện mới' },
          ...conversations.map((item) => ({ value: item.id,
            label: `${item.turns[0]?.message.slice(0, 55) || 'Hội thoại'} · ${new Date(item.updatedAt).toLocaleDateString('vi-VN')}` })),
        ]} />
    </div>
    {(turns.length > 0 || chatMode) && <div className={`${chatMode ? 'min-h-64 max-h-[min(55vh,560px)]' : 'max-h-96'} space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3`} aria-live="polite">
      {chatMode && turns.length === 0 && !pendingMessage && <p className="py-12 text-center text-sm text-slate-500">Hãy đặt câu hỏi về tài liệu đã chọn. Trợ lý sẽ trả lời tại đây.</p>}
      {turns.map((turn) => {
        const actions = usefulActions(turn.answer.summary, turn.answer.actions)
        return <div key={turn.id} className="space-y-2 text-sm">
        <p className="ml-auto w-fit max-w-[90%] rounded-xl bg-blue-600 px-3 py-2 text-white">{turn.message}</p>
        <div className="max-w-[95%] rounded-xl border border-slate-200 bg-white p-3 text-slate-800">
          <AgentAnswerMarkdown text={turn.answer.summary} />
          {actions.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">
            {actions.map((action, index) => <li key={index}>{action}</li>)}
          </ul>}
          {turn.answer.caveat && <p className="mt-2 text-slate-500">{turn.answer.caveat}</p>}
        </div>
      </div>
      })}
      {pendingMessage && <div className="space-y-2 text-sm">
        <p className="ml-auto w-fit max-w-[90%] rounded-xl bg-blue-600 px-3 py-2 text-white">{pendingMessage}</p>
        <p className="w-fit rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-500">Trợ lý đang trả lời…</p>
      </div>}
      <div ref={bottomRef} />
    </div>}
  </div>
}
