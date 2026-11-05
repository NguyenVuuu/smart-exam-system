import { useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { RichContent } from '../../ui/RichContent'
import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import type { TeacherQuestion } from '../../../types/teacher-questions.types'

const difficulties = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' } as const
const types = { SINGLE_CHOICE: 'Một đáp án', MULTIPLE_CHOICE: 'Nhiều đáp án', TRUE_FALSE: 'Đúng/sai', PROGRAMMING: 'Lập trình' } as const

export function QuestionCard({ question, onEdit }: { question: TeacherQuestion; onEdit?: () => void }) {
  const [expanded, setExpanded] = useState(false)
  return <SectionCard>
    <Pressable accessibilityRole="button" accessibilityLabel={`Xem câu hỏi ${question.title}`} onPress={() => setExpanded((value) => !value)}>
      <View style={styles.badges}><StatusBadge label={types[question.type]} /><StatusBadge label={difficulties[question.difficulty]} tone="warning" /></View>
      <Text style={styles.title}>{question.title}</Text>
      <Text style={styles.meta}>{question.subject.code} · {question.subject.name}</Text>
      {question.sharedBank ? <Text style={styles.meta}>Ngân hàng chung: {question.sharedBank.removedAt ? 'Đã gỡ' : question.sharedBank.status === 'APPROVED' ? 'Đã duyệt' : question.sharedBank.status === 'PENDING' ? 'Chờ duyệt' : 'Cần sửa'}</Text> : null}
      <Text style={styles.link}>{expanded ? 'Thu gọn' : 'Xem nội dung'}</Text>
    </Pressable>
    {expanded && <View style={styles.detail}>
      <RichContent content={question.content} />
      {question.options.map((option) => <View key={option.id} style={[styles.option, option.isCorrect && styles.correct]}>
        <RichContent content={option.content} />{option.isCorrect ? <Text style={styles.answer}>Đáp án đúng</Text> : null}
      </View>)}
      {question.explanation ? <View style={styles.explanation}><Text style={styles.meta}>Giải thích</Text><RichContent content={question.explanation} /></View> : null}
      {question.sharedBank?.rejectionReason ? <Text style={styles.reject}>Góp ý: {question.sharedBank.rejectionReason}</Text> : null}
      {onEdit && <Pressable accessibilityRole="button" onPress={onEdit} style={styles.editButton}><Text style={styles.link}>Chỉnh sửa câu hỏi</Text></Pressable>}
    </View>}
  </SectionCard>
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  title: { color: '#0f172a', fontWeight: '700', fontSize: 15 }, meta: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 4 },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '700', marginTop: 8 }, detail: { borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 12, paddingTop: 12 },
  option: { padding: 10, borderRadius: 9, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 6 }, correct: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  answer: { color: '#047857', fontSize: 11, fontWeight: '700' }, explanation: { marginTop: 12 }, reject: { color: '#be123c', marginTop: 10, fontSize: 13 },
  editButton: { minHeight: 44, justifyContent: 'center' },
})
