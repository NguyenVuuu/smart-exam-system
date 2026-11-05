import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { QuestionOptionsEditor } from '../question-bank/QuestionOptionsEditor'
import type { GeneratedQuestion } from '../../../types/teacher-ai.types'
import type { ObjectiveQuestionPayload } from '../../../types/teacher-questions.types'

interface Props { question: GeneratedQuestion; number: number; decision: 'pending' | 'accepted' | 'rejected'
  onAccept: () => void; onReject: () => void; onChange: (question: GeneratedQuestion) => void; onInputFocus: (handle: number) => void }

export function AiReviewCard({ question, number, decision, onAccept, onReject, onChange, onInputFocus }: Props) {
  return <View style={styles.card}>
    <View style={styles.header}><Text style={styles.heading}>Câu {number}</Text>
      <View style={styles.actions}>
        <Pressable accessibilityRole="button" onPress={onReject} style={[styles.select, decision === 'rejected' && styles.rejected]}>
          <Text style={styles.rejectText}>{decision === 'rejected' ? 'Đã từ chối' : 'Từ chối'}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onAccept} style={[styles.select, decision === 'accepted' && styles.selected]}>
          <Text style={styles.selectText}>{decision === 'accepted' ? 'Đã chọn' : 'Chấp nhận'}</Text>
        </Pressable>
      </View>
    </View>
    <Text style={styles.label}>Nội dung câu hỏi</Text>
    <TextInput value={question.content || question.title} onChangeText={(content) => onChange({ ...question, content, title: content.slice(0, 200) })}
      onFocus={(event) => onInputFocus(event.nativeEvent.target)} multiline maxLength={10000} textAlignVertical="top" style={styles.input} />
    <View style={styles.options}><QuestionOptionsEditor type={question.type as ObjectiveQuestionPayload['type']}
      options={question.options} onChange={(options) => onChange({ ...question, options })} onInputFocus={onInputFocus} /></View>
    <Text style={styles.label}>Giải thích</Text>
    <TextInput value={question.explanation} onChangeText={(explanation) => onChange({ ...question, explanation })}
      onFocus={(event) => onInputFocus(event.nativeEvent.target)} multiline maxLength={5000} textAlignVertical="top" style={styles.input} />
  </View>
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, heading: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 5, flexShrink: 1 },
  select: { minHeight: 32, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  selected: { backgroundColor: '#ecfdf5' }, selectText: { color: '#047857', fontWeight: '700', fontSize: 11 },
  rejected: { backgroundColor: '#fff1f2' }, rejectText: { color: '#be123c', fontWeight: '700', fontSize: 11 },
  label: { color: '#334155', fontWeight: '700', marginTop: 12, marginBottom: 8 },
  input: { minHeight: 70, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', padding: 10, color: '#0f172a' },
  options: { marginTop: 12 },
})
