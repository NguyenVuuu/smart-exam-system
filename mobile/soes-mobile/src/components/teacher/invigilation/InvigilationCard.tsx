import { CalendarClock, BookOpen, UsersRound } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'
import type { InvigilationAssignment } from '../../../types/teacher-invigilation.types'
import { formatDateTime } from '../../../utils/date'
import { StatusBadge } from '../../ui/StatusBadge'

const labels = { SCHEDULED: 'Sắp tới', OPEN: 'Đang diễn ra', CLOSED: 'Đã kết thúc' }

export function InvigilationCard({ assignment }: { assignment: InvigilationAssignment }) {
  return <View style={styles.card}>
    <View style={styles.heading}><Text style={styles.title}>{assignment.title}</Text><StatusBadge label={labels[assignment.status]} tone={assignment.status === 'OPEN' ? 'success' : 'neutral'} /></View>
    <View style={styles.row}><BookOpen size={16} color="#64748b" /><Text style={styles.meta}>{assignment.courseOffering.subjectName} · {assignment.courseOffering.code}</Text></View>
    <View style={styles.row}><CalendarClock size={16} color="#64748b" /><Text style={styles.meta}>{formatDateTime(assignment.startTime)} – {formatDateTime(assignment.endTime)}</Text></View>
    <View style={styles.row}><UsersRound size={16} color="#64748b" /><Text style={styles.meta}>{assignment.source === 'ASSIGNED' ? 'Được phân công coi thi' : 'Ca thi bạn tạo'}</Text></View>
  </View>
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14, marginBottom: 10 },
  heading: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 10 },
  title: { flex: 1, minWidth: 0, color: '#0f172a', fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 6 }, meta: { flex: 1, minWidth: 0, color: '#475569', fontSize: 13, lineHeight: 19 },
})
