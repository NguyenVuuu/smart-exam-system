import { useRef } from 'react'
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { QuestionOptionsEditor } from '../question-bank/QuestionOptionsEditor'
import type { GeneratedQuestion } from '../../../types/teacher-ai.types'
import type { ObjectiveQuestionPayload } from '../../../types/teacher-questions.types'
import { Tags } from 'lucide-react-native'

interface Props {
  question: GeneratedQuestion
  number: number
  decision: 'pending' | 'accepted' | 'rejected'
  onAccept: () => void
  onReject: () => void
  onChange: (question: GeneratedQuestion) => void
  onFocusField?: (relativeY: number) => void
  onTopics: () => void
  topicNames: string[]
}

export function AiReviewCard({
  question,
  number,
  decision,
  onAccept,
  onReject,
  onChange,
  onFocusField,
  onTopics,
  topicNames,
}: Props) {
  const contentY = useRef(0)
  const optionsY = useRef(0)
  const explanationY = useRef(0)

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.heading}>Câu {number}</Text>
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            onPress={onReject}
            style={[styles.select, decision === 'rejected' && styles.rejected]}
          >
            <Text style={styles.rejectText}>{decision === 'rejected' ? 'Đã từ chối' : 'Từ chối'}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={onAccept}
            style={[styles.select, decision === 'accepted' && styles.selected]}
          >
            <Text style={styles.selectText}>{decision === 'accepted' ? 'Đã chọn' : 'Chấp nhận'}</Text>
          </Pressable>
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onTopics} style={styles.topicButton}>
        <Tags size={17} color="#2563eb" /><Text style={styles.topicText}>Chủ đề: {topicNames.length ? topicNames.join(', ') : 'Chọn chủ đề'}</Text>
      </Pressable>
      <View onLayout={(e) => { contentY.current = e.nativeEvent.layout.y }}>
        <Text style={styles.label}>Nội dung câu hỏi</Text>
        <TextInput
          value={question.content || question.title}
          onChangeText={(content) =>
            onChange({ ...question, content, title: content.slice(0, 200) })
          }
          multiline
          maxLength={10000}
          textAlignVertical="top"
          style={styles.input}
          onFocus={() => onFocusField?.(contentY.current)}
        />
      </View>
      <View
        style={styles.options}
        onLayout={(e) => { optionsY.current = e.nativeEvent.layout.y }}
      >
        <QuestionOptionsEditor
          type={question.type as ObjectiveQuestionPayload['type']}
          options={question.options}
          onChange={(options) => onChange({ ...question, options })}
          onFocusOption={(_idx, rowY) => onFocusField?.(optionsY.current + rowY)}
        />
      </View>
      <View onLayout={(e) => { explanationY.current = e.nativeEvent.layout.y }}>
        <Text style={styles.label}>Giải thích</Text>
        <TextInput
          value={question.explanation}
          onChangeText={(explanation) => onChange({ ...question, explanation })}
          multiline
          maxLength={5000}
          textAlignVertical="top"
          style={styles.input}
          onFocus={() => onFocusField?.(explanationY.current)}
        />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff', marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  heading: { color: '#0f172a', fontWeight: '800', fontSize: 15 },
  actions: { flexDirection: 'row', gap: 5, flexShrink: 1 },
  select: { minHeight: 32, borderRadius: 8, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 7 },
  selected: { backgroundColor: '#ecfdf5' },
  selectText: { color: '#047857', fontWeight: '700', fontSize: 11 },
  rejected: { backgroundColor: '#fff1f2' },
  rejectText: { color: '#be123c', fontWeight: '700', fontSize: 11 },
  label: { color: '#334155', fontWeight: '700', marginTop: 12, marginBottom: 8 },
  input: { minHeight: 70, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, backgroundColor: '#fff', padding: 10, color: '#0f172a' },
  options: { marginTop: 12 },
  topicButton: { flexDirection: 'row', alignItems: 'center', gap: 7, padding: 10, marginTop: 12, borderRadius: 10, backgroundColor: '#eff6ff' },
  topicText: { color: '#1d4ed8', fontWeight: '700', flex: 1 },
})
