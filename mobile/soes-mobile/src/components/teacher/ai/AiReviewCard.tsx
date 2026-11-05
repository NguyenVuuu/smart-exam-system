import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { QuestionOptionsEditor } from '../question-bank/QuestionOptionsEditor'
import { SectionCard } from '../../ui/SectionCard'
import type { GeneratedQuestion } from '../../../types/teacher-ai.types'
import type { ObjectiveQuestionPayload } from '../../../types/teacher-questions.types'

interface Props { question: GeneratedQuestion; number: number; selected: boolean
  onSelect: () => void; onChange: (question: GeneratedQuestion) => void }

export function AiReviewCard({ question, number, selected, onSelect, onChange }: Props) {
  return <SectionCard title={`Câu ${number}`}>
    <Pressable accessibilityRole="button" onPress={onSelect} style={[styles.select, selected && styles.selected]}>
      <Text style={styles.selectText}>{selected ? 'Đã chọn lưu' : 'Chọn lưu câu này'}</Text>
    </Pressable>
    <Text style={styles.label}>Tiêu đề</Text>
    <TextInput value={question.title} onChangeText={(title) => onChange({ ...question, title })}
      multiline maxLength={200} textAlignVertical="top" style={styles.input} />
    <Text style={styles.label}>Nội dung câu hỏi</Text>
    <TextInput value={question.content} onChangeText={(content) => onChange({ ...question, content })}
      multiline maxLength={10000} textAlignVertical="top" style={styles.input} />
    <View style={styles.options}><QuestionOptionsEditor type={question.type as ObjectiveQuestionPayload['type']}
      options={question.options} onChange={(options) => onChange({ ...question, options })} /></View>
    <Text style={styles.label}>Giải thích</Text>
    <TextInput value={question.explanation} onChangeText={(explanation) => onChange({ ...question, explanation })}
      multiline maxLength={5000} textAlignVertical="top" style={styles.input} />
  </SectionCard>
}

const styles = StyleSheet.create({
  select: { minHeight: 42, borderRadius: 9, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: '#ecfdf5' }, selectText: { color: '#047857', fontWeight: '700' },
  label: { color: '#334155', fontWeight: '700', marginTop: 12, marginBottom: 8 },
  input: { minHeight: 70, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', padding: 10, color: '#0f172a' },
  options: { marginTop: 12 },
})
