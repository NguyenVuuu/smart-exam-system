import AppSelect from './AppSelect'

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

export default function AgentConversationHistory<TAnswer extends { summary: string; actions: string[]; caveat: string | null; evidenceIds?: string[] }>({
  conversations, currentId, turns, onSelect, source,
}: {
  conversations: AgentConversationSummary[]
  currentId: string
  turns: AgentConversationTurn<TAnswer>[]
  onSelect: (id: string) => void
  source?: { id: string; label: string }
}) {
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
    {turns.length > 0 && <div className="max-h-96 space-y-3 overflow-y-auto rounded-xl border border-slate-100 bg-slate-50 p-3" aria-live="polite">
      {turns.map((turn) => <div key={turn.id} className="space-y-2 text-sm">
        <p className="ml-auto w-fit max-w-[90%] rounded-xl bg-blue-600 px-3 py-2 text-white">{turn.message}</p>
        <div className="max-w-[95%] rounded-xl border border-slate-200 bg-white p-3 text-slate-800">
          <p className="font-medium">{turn.answer.summary}</p>
          {turn.answer.actions.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5">
            {turn.answer.actions.map((action, index) => <li key={index}>{action}</li>)}
          </ul>}
          {turn.answer.caveat && <p className="mt-2 text-slate-500">{turn.answer.caveat}</p>}
          {source && turn.answer.evidenceIds?.includes(source.id) &&
            <p className="mt-2 border-t border-slate-100 pt-2 text-xs text-blue-700">Nguồn: {source.label}</p>}
        </div>
      </div>)}
    </div>}
  </div>
}
