import { ArrowUpRight } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import type { TeacherNotification } from '../../../types/teacher-notifications.types'
import { formatDateTime } from '../../../utils/date'

interface Props { item: TeacherNotification; onPress: () => void; hasTarget: boolean }

export function TeacherNotificationCard({ item, onPress, hasTarget }: Props) {
  return <Pressable accessibilityRole="button" onPress={onPress} style={[styles.card, !item.isRead && styles.unread]}>
    <View style={styles.header}><Text style={styles.title}>{item.title}</Text>{hasTarget && <ArrowUpRight size={17} color="#64748b" />}</View>
    <Text style={styles.content}>{item.content}</Text>
    <Text style={styles.date}>{formatDateTime(item.createdAt)}</Text>
  </Pressable>
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 10 },
  unread: { borderColor: '#bfdbfe', backgroundColor: '#eff6ff' },
  header: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' }, title: { flex: 1, minWidth: 0, fontWeight: '700', color: '#0f172a' },
  content: { color: '#475569', marginTop: 5, lineHeight: 20 }, date: { color: '#94a3b8', fontSize: 11, marginTop: 8 },
})
