import { useState } from 'react'
import { Archive, ArchiveRestore, CloudUpload, Pencil, Tags } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { RichContent } from '../../ui/RichContent'
import { SectionCard } from '../../ui/SectionCard'
import { StatusBadge } from '../../ui/StatusBadge'
import type { TeacherQuestion } from '../../../types/teacher-questions.types'

const difficulties = { EASY: 'Dễ', MEDIUM: 'Trung bình', HARD: 'Khó' } as const
const types = { SINGLE_CHOICE: 'Một đáp án', MULTIPLE_CHOICE: 'Nhiều đáp án', TRUE_FALSE: 'Đúng/sai', PROGRAMMING: 'Lập trình' } as const

interface Props {
  question: TeacherQuestion
  onEdit?: () => void
  onShare?: () => void
  onArchive?: () => void
  onRestore?: () => void
  onTopics?: () => void
}

export function QuestionCard({ question, onEdit, onShare, onArchive, onRestore, onTopics }: Props) {
  const [expanded, setExpanded] = useState(false)
  return <SectionCard>
    <Pressable accessibilityRole="button" accessibilityLabel={`Xem câu hỏi ${question.title}`} onPress={() => setExpanded((value) => !value)}>
      <View style={styles.badges}><StatusBadge label={types[question.type]} /><StatusBadge label={difficulties[question.difficulty]} tone="warning" /></View>
      <Text style={styles.title}>{question.title}</Text>
      <Text style={styles.meta}>{question.subject.code} · {question.subject.name}</Text>
      <Text style={styles.meta}>Chủ đề: {question.topics?.length ? question.topics.map((topic) => topic.name).join(', ') : 'Chưa gắn nhãn'}</Text>
      {question.sharedBank ? <Text style={styles.meta}>Ngân hàng chung: {question.sharedBank.removedAt ? 'Đã gỡ' : question.sharedBank.status === 'APPROVED' ? 'Đã duyệt' : question.sharedBank.status === 'PENDING' ? 'Chờ duyệt' : 'Cần sửa'}</Text> : null}
      <Text style={styles.link}>{expanded ? 'Thu gọn' : 'Xem nội dung'}</Text>
    </Pressable>
    {expanded && <View style={styles.detail}>
      <RichContent content={question.content} />
      {question.options.map((option) => <View key={option.id} style={[styles.option, option.isCorrect && styles.correct]}>
        <RichContent content={option.content} />
      </View>)}
      {question.explanation ? <View style={styles.explanation}><Text style={styles.meta}>Giải thích</Text><RichContent content={question.explanation} /></View> : null}
      {question.sharedBank?.rejectionReason ? <Text style={styles.reject}>Góp ý: {question.sharedBank.rejectionReason}</Text> : null}
    </View>}
    {(onEdit || onShare || onArchive || onRestore || onTopics) && <View style={styles.actions}>
      {onTopics && <Pressable accessibilityRole="button" accessibilityLabel="Gắn chủ đề câu hỏi" onPress={onTopics} style={styles.iconButton}><Tags size={19} color="#7c3aed" /></Pressable>}
      {onShare && <Pressable accessibilityRole="button" accessibilityLabel="Gửi duyệt ngân hàng chung" onPress={onShare} style={styles.iconButton}><CloudUpload size={19} color="#059669" /></Pressable>}
      {onEdit && <Pressable accessibilityRole="button" accessibilityLabel="Chỉnh sửa câu hỏi" onPress={onEdit} style={styles.iconButton}><Pencil size={19} color="#2563eb" /></Pressable>}
      {onArchive && <Pressable accessibilityRole="button" accessibilityLabel="Lưu trữ câu hỏi" onPress={onArchive} style={styles.iconButton}><Archive size={19} color="#475569" /></Pressable>}
      {onRestore && <Pressable accessibilityRole="button" accessibilityLabel="Khôi phục câu hỏi" onPress={onRestore} style={styles.iconButton}><ArchiveRestore size={19} color="#2563eb" /></Pressable>}
    </View>}
  </SectionCard>
}

const styles = StyleSheet.create({
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 },
  title: { color: '#0f172a', fontWeight: '700', fontSize: 15 }, meta: { color: '#64748b', fontSize: 12, lineHeight: 18, marginTop: 4 },
  link: { color: '#2563eb', fontSize: 13, fontWeight: '700', marginTop: 8 }, detail: { borderTopWidth: 1, borderTopColor: '#e2e8f0', marginTop: 12, paddingTop: 12 },
  option: { padding: 10, borderRadius: 9, borderWidth: 1, borderColor: '#e2e8f0', marginTop: 6 }, correct: { backgroundColor: '#ecfdf5', borderColor: '#a7f3d0' },
  explanation: { marginTop: 12 }, reject: { color: '#be123c', marginTop: 10, fontSize: 13 },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 4, marginTop: 8 },
  iconButton: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' },
})
