import { Check, Circle } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { ObjectiveQuestionPayload } from '../../../types/teacher-questions.types'

type Option = ObjectiveQuestionPayload['options'][number]
interface Props { type: ObjectiveQuestionPayload['type']; options: Option[]; onChange: (options: Option[]) => void }

export function QuestionOptionsEditor({ type, options, onChange }: Props) {
  const single = type !== 'MULTIPLE_CHOICE'
  return <View>
    <Text style={styles.label}>Phương án trả lời</Text>
    {options.map((option, index) => <View key={index} style={styles.row}>
      <Pressable accessibilityRole="button" accessibilityLabel={`Đánh dấu đáp án ${index + 1}`}
        onPress={() => onChange(options.map((item, position) => ({ ...item,
          isCorrect: position === index ? !item.isCorrect : single ? false : item.isCorrect,
        })))} style={[styles.mark, option.isCorrect && styles.correct]}>
        {option.isCorrect ? <Check size={20} color="#059669" /> : <Circle size={20} color="#64748b" />}
      </Pressable>
      <TextInput style={styles.input} value={option.content} editable={type !== 'TRUE_FALSE'} maxLength={1000}
        placeholder={`Phương án ${index + 1}`} placeholderTextColor="#94a3b8"
        onChangeText={(content) => onChange(options.map((item, position) => position === index ? { ...item, content } : item))} />
      {type !== 'TRUE_FALSE' && options.length > 2 && <Pressable accessibilityRole="button" accessibilityLabel={`Xóa phương án ${index + 1}`}
        onPress={() => onChange(options.filter((_, position) => position !== index))} style={styles.remove}><Text style={styles.removeText}>Xóa</Text></Pressable>}
    </View>)}
    {type !== 'TRUE_FALSE' && options.length < 20 && <Pressable accessibilityRole="button" style={styles.add}
      onPress={() => onChange([...options, { content: '', isCorrect: false }])}><Text style={styles.addText}>+ Thêm phương án</Text></Pressable>}
  </View>
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginBottom: 8 }, row: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  mark: { width: 42, height: 44, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  correct: { backgroundColor: '#ecfdf5', borderColor: '#059669' },
  input: { flex: 1, minWidth: 0, minHeight: 44, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 10, color: '#0f172a' },
  remove: { minWidth: 44, minHeight: 44, justifyContent: 'center' }, removeText: { color: '#be123c', fontSize: 12 },
  add: { minHeight: 44, justifyContent: 'center' }, addText: { color: '#2563eb', fontWeight: '700' },
})
