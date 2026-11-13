import { Text, View } from 'react-native'
import { ChoicePicker } from '../ui/ChoicePicker'
import type { LearningConversationSummary, LearningConversationTurn, StudyMaterial } from '../../api/student-learning.api'

export function StudentConversationHistory({ conversations, currentId, turns, material, onSelect }: {
  conversations: LearningConversationSummary[]
  currentId: string
  turns: LearningConversationTurn[]
  material?: StudyMaterial
  onSelect: (id: string) => void
}) {
  return <View style={{ gap: 12 }}>
    <ChoicePicker label="Hội thoại" placeholder="Cuộc trò chuyện mới"
      options={[{ value: 'new', label: 'Cuộc trò chuyện mới' }, ...conversations.map((item) => ({
        value: item.id,
        label: item.turns[0]?.message.slice(0, 55) || 'Hội thoại',
        description: new Date(item.updatedAt).toLocaleDateString('vi-VN'),
      }))]}
      selectedValues={[currentId || 'new']} onToggle={(value) => onSelect(value === 'new' ? '' : value)} />
    {turns.length > 0 && <View style={{ padding: 12, borderRadius: 12, backgroundColor: '#f8fafc', gap: 12 }}>
      {turns.map((turn) => <View key={turn.id} style={{ gap: 7 }}>
        <View style={{ alignSelf: 'flex-end', maxWidth: '90%', borderRadius: 12, backgroundColor: '#2563eb', padding: 10 }}>
          <Text style={{ color: '#fff' }}>{turn.message}</Text>
        </View>
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', padding: 12, gap: 7 }}>
          <Text style={{ color: '#0f172a', fontWeight: '600' }}>{turn.answer.summary}</Text>
          {turn.answer.actions.map((action, index) => <Text key={index} style={{ color: '#334155' }}>• {action}</Text>)}
          {!!turn.answer.caveat && <Text style={{ color: '#64748b' }}>{turn.answer.caveat}</Text>}
          {material && turn.answer.evidenceIds.includes(material.id) &&
            <Text style={{ color: '#1d4ed8', fontSize: 12 }}>Nguồn: {material.title || material.fileName}</Text>}
        </View>
      </View>)}
    </View>}
  </View>
}
