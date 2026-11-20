import { Text, View } from 'react-native'
import { ChoicePicker } from '../ui/ChoicePicker'
import type { LearningConversationSummary, LearningConversationTurn, StudyMaterial } from '../../api/student-learning.api'

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

export function StudentConversationHistory({ conversations, currentId, turns, material, onSelect, pendingMessage }: {
  conversations: LearningConversationSummary[]
  currentId: string
  turns: LearningConversationTurn[]
  material?: StudyMaterial
  onSelect: (id: string) => void
  pendingMessage?: string
}) {
  return <View style={{ gap: 12 }}>
    <ChoicePicker label="Hội thoại" placeholder="Cuộc trò chuyện mới"
      options={[{ value: 'new', label: 'Cuộc trò chuyện mới' }, ...conversations.map((item) => ({
        value: item.id,
        label: item.turns[0]?.message.slice(0, 55) || 'Hội thoại',
        description: new Date(item.updatedAt).toLocaleDateString('vi-VN'),
      }))]}
      selectedValues={[currentId || 'new']} onToggle={(value) => onSelect(value === 'new' ? '' : value)} />
    <View style={{ minHeight: 160, padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', gap: 12 }}>
      {turns.length === 0 && !pendingMessage && <Text style={{ paddingVertical: 45, color: '#64748b', textAlign: 'center' }}>Hãy đặt câu hỏi về tài liệu đã chọn. Trợ lý sẽ trả lời tại đây.</Text>}
      {turns.map((turn) => <View key={turn.id} style={{ gap: 7 }}>
        <View style={{ alignSelf: 'flex-end', maxWidth: '90%', borderRadius: 12, backgroundColor: '#2563eb', padding: 10 }}>
          <Text style={{ color: '#fff' }}>{turn.message}</Text>
        </View>
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', padding: 12, gap: 7 }}>
          <Text style={{ color: '#0f172a', fontWeight: '600' }}>{turn.answer.summary}</Text>
          {usefulActions(turn.answer.summary, turn.answer.actions).map((action, index) => <Text key={index} style={{ color: '#334155' }}>• {action}</Text>)}
          {!!turn.answer.caveat && <Text style={{ color: '#64748b' }}>{turn.answer.caveat}</Text>}
          {material && turn.answer.evidenceIds.includes(material.id) &&
            <View style={{ gap: 3 }}>
              <Text style={{ color: '#1d4ed8', fontSize: 12 }}>Nguồn: {material.title || material.fileName}{turn.answer.sourceLocation ? ` · ${turn.answer.sourceLocation}` : ''}</Text>
              {!!turn.answer.sourceQuote && <Text style={{ color: '#64748b', fontSize: 12 }}>“{turn.answer.sourceQuote}”</Text>}
            </View>}
        </View>
      </View>)}
      {!!pendingMessage && <View style={{ gap: 8 }}>
        <View style={{ alignSelf: 'flex-end', maxWidth: '90%', borderRadius: 12, backgroundColor: '#2563eb', padding: 10 }}>
          <Text style={{ color: '#fff' }}>{pendingMessage}</Text>
        </View>
        <Text style={{ alignSelf: 'flex-start', borderRadius: 12, backgroundColor: '#fff', padding: 12, color: '#64748b' }}>Trợ lý đang trả lời…</Text>
      </View>}
    </View>
  </View>
}
