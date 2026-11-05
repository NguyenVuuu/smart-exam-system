import { router } from 'expo-router'
import { ArrowRight, Users } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { StatusBadge } from '../../ui/StatusBadge'
import type { TeacherCourse } from '../../../types/teacher-courses.types'

export function CourseCard({ course }: { course: TeacherCourse }) {
  return <Pressable style={styles.card} onPress={() => router.push({ pathname: '/(app)/(teacher)/courses/[courseOfferingId]', params: { courseOfferingId: course.id } })}>
    <View style={styles.heading}><Text style={styles.code}>{course.subject.code} · {course.code}</Text><StatusBadge label={course.status === 'ACTIVE' ? 'Đang mở' : 'Đã đóng'} tone={course.status === 'ACTIVE' ? 'success' : 'neutral'} /></View>
    <Text style={styles.name} numberOfLines={2}>{course.subject.name}</Text>
    <Text style={styles.semester}>{course.semester.name}</Text>
    <View style={styles.footer}><Users size={16} color="#64748b" /><Text style={styles.count}>{course.enrollmentCount} sinh viên</Text><ArrowRight size={17} color="#2563eb" /></View>
  </Pressable>
}

const styles = StyleSheet.create({
  card: { padding: 16, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', marginBottom: 10 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  code: { color: '#2563eb', fontSize: 12, fontWeight: '700', flexShrink: 1 },
  name: { color: '#0f172a', fontSize: 16, fontWeight: '700', marginTop: 8 },
  semester: { color: '#64748b', fontSize: 12, marginTop: 4 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  count: { flex: 1, color: '#64748b', fontSize: 12 },
})
