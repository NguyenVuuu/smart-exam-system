import { View, Text } from 'react-native'
import { CalendarDays } from 'lucide-react-native'
import type { UpcomingExam } from '../../types/dashboard.types'

export default function UpcomingExamList({ exams }: { exams: UpcomingExam[] }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#f0fdf4', alignItems: 'center', justifyContent: 'center' }}>
          <CalendarDays size={16} color="#16a34a" />
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>Bài thi sắp tới</Text>
      </View>

      {exams.length === 0 ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>Không có bài thi nào.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {exams.map((exam) => (
            <View key={exam.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ marginTop: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: exam.status === 'soon' ? '#22c55e' : '#86efac', flexShrink: 0 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: '#1e293b', lineHeight: 17 }} numberOfLines={2}>
                  {exam.title}
                </Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
                  {exam.date} · {exam.time}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
