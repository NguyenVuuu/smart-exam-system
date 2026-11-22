import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { CalendarDays, ChevronLeft, ChevronRight, Clock3, Search, Timer, X } from 'lucide-react-native'
import { BackToTopScrollView } from '../../../src/components/ui/BackToTop'
import StudentLayout from '../../../src/components/student/StudentLayout'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { getStudentExamSchedules, type StudentExamSchedule } from '../../../src/api/student-portal.api'

type Filter = 'ALL' | 'OPEN' | 'UPCOMING' | 'COMPLETED'
const filters: { key: Filter; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'UPCOMING', label: 'Sắp thi' },
  { key: 'OPEN', label: 'Đang diễn ra' }, { key: 'COMPLETED', label: 'Đã kết thúc' },
]

function dateTime(value: string) {
  const d = new Date(value)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} · ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
}

function status(status: StudentExamSchedule['status']) {
  if (status === 'OPEN') return { text: 'Đang diễn ra', color: '#15803d', bg: '#dcfce7' }
  if (status === 'UPCOMING') return { text: 'Sắp thi', color: '#1d4ed8', bg: '#dbeafe' }
  return { text: 'Đã kết thúc', color: '#64748b', bg: '#f1f5f9' }
}

function dayKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function monthDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const start = (first.getDay() + 6) % 7
  const total = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  return Array.from({ length: Math.max(35, Math.ceil((start + total) / 7) * 7) }, (_, index) => {
    const date = new Date(month.getFullYear(), month.getMonth(), index - start + 1)
    return { date, key: dayKey(date), current: date.getMonth() === month.getMonth() }
  })
}

function ExamCard({ exam }: { exam: StudentExamSchedule }) {
  const badge = status(exam.status)
  return <TouchableOpacity activeOpacity={0.78}
    onPress={() => router.push(`/(app)/(student)/course/${exam.courseOfferingId}/exam/${exam.id}?readonly=1` as never)}
    style={{ backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' }}>
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
      <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}><CalendarDays size={21} color="#2563eb" /></View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 11, color: '#64748b', fontWeight: '700' }}>{exam.subjectCode} · {exam.courseCode}</Text>
        <Text style={{ fontSize: 15, color: '#0f172a', fontWeight: '800', lineHeight: 21, marginTop: 3 }}>{exam.title}</Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 3 }} numberOfLines={1}>{exam.subjectName}</Text>
      </View>
      <View style={{ paddingHorizontal: 8, paddingVertical: 5, borderRadius: 8, backgroundColor: badge.bg }}><Text style={{ fontSize: 10, fontWeight: '700', color: badge.color }}>{badge.text}</Text></View>
    </View>
    <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9', gap: 8 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Clock3 size={14} color="#64748b" /><Text style={{ fontSize: 12, color: '#475569' }}>{dateTime(exam.startTime)} → {dateTime(exam.endTime)}</Text></View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}><Timer size={14} color="#64748b" /><Text style={{ fontSize: 12, color: '#475569' }}>{exam.durationMinutes} phút · GV: {exam.teacherName}</Text></View>
    </View>
    <Text style={{ color: '#2563eb', fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: 12 }}>Xem thông tin bài thi →</Text>
  </TouchableOpacity>
}

export default function ExamScheduleScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const [items, setItems] = useState<StudentExamSchedule[]>([])
  const [filter, setFilter] = useState<Filter>('ALL')
  const [keyword, setKeyword] = useState('')
  const [visibleMonth, setVisibleMonth] = useState(() => new Date())
  const [selectedDate, setSelectedDate] = useState(() => dayKey(new Date()))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true); setError(null)
    getStudentExamSchedules({ page: 1, pageSize: 100, status: filter, keyword: keyword || undefined })
      .then(data => alive && setItems(data.items))
      .catch(() => alive && setError('Không thể tải lịch thi. Vui lòng thử lại.'))
      .finally(() => alive && setLoading(false))
    return () => { alive = false }
  }, [filter, keyword])

  const calendarDays = useMemo(() => monthDays(visibleMonth), [visibleMonth])
  const examsByDate = useMemo(() => {
    const grouped = new Map<string, StudentExamSchedule[]>()
    items.forEach(item => {
      const key = dayKey(new Date(item.startTime))
      grouped.set(key, [...(grouped.get(key) ?? []), item])
    })
    grouped.forEach(list => list.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()))
    return grouped
  }, [items])
  const selectedExams = examsByDate.get(selectedDate) ?? []
  const monthTitle = `Tháng ${String(visibleMonth.getMonth() + 1).padStart(2, '0')}/${visibleMonth.getFullYear()}`

  if (!isInitialized || !isAuthenticated) return null
  return <StudentLayout activeRoute="exam-schedule">
    <BackToTopScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}><CalendarDays size={22} color="#2563eb" /><Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>Lịch thi</Text></View>
      <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Xem lịch và thông tin bài thi. Không thể vào làm bài trên mobile.</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#e2e8f0', paddingHorizontal: 12, height: 42, marginBottom: 10 }}><Search size={17} color="#94a3b8" style={{ marginRight: 8 }} /><TextInput style={{ flex: 1, fontSize: 13, color: '#0f172a' }} placeholder="Tìm bài thi hoặc môn học..." placeholderTextColor="#94a3b8" value={keyword} onChangeText={setKeyword} />{keyword ? <TouchableOpacity onPress={() => setKeyword('')}><X size={16} color="#94a3b8" /></TouchableOpacity> : null}</View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}><View style={{ flexDirection: 'row', gap: 6 }}>{filters.map(item => <TouchableOpacity key={item.key} onPress={() => setFilter(item.key)} style={{ paddingHorizontal: 13, paddingVertical: 7, borderRadius: 18, backgroundColor: filter === item.key ? '#eff6ff' : '#fff', borderWidth: 1, borderColor: filter === item.key ? '#93c5fd' : '#e2e8f0' }}><Text style={{ fontSize: 12, fontWeight: '600', color: filter === item.key ? '#1d4ed8' : '#475569' }}>{item.label}</Text></TouchableOpacity>)}</View></ScrollView>
      {loading ? <View style={{ paddingTop: 40, alignItems: 'center' }}><ActivityIndicator size="large" color="#2563eb" /></View> : error ? <View style={{ alignItems: 'center', paddingVertical: 40 }}><Text style={{ color: '#dc2626', marginBottom: 12 }}>{error}</Text><TouchableOpacity onPress={() => setFilter(filter)}><Text style={{ color: '#2563eb', fontWeight: '700' }}>Thử lại</Text></TouchableOpacity></View> : <>
        <View style={{ backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: '#e2e8f0', overflow: 'hidden', marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
            <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() - 1, 1))} style={{ padding: 6 }}><ChevronLeft size={19} color="#475569" /></TouchableOpacity>
            <View style={{ alignItems: 'center' }}><Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>{monthTitle}</Text><TouchableOpacity onPress={() => { const now = new Date(); setVisibleMonth(now); setSelectedDate(dayKey(now)) }}><Text style={{ fontSize: 11, color: '#2563eb', fontWeight: '700', marginTop: 2 }}>Hôm nay</Text></TouchableOpacity></View>
            <TouchableOpacity onPress={() => setVisibleMonth(new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 1))} style={{ padding: 6 }}><ChevronRight size={19} color="#475569" /></TouchableOpacity>
          </View>
          <View style={{ flexDirection: 'row', backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' }}>{['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map(label => <Text key={label} style={{ flex: 1, textAlign: 'center', paddingVertical: 9, color: '#64748b', fontSize: 10, fontWeight: '800' }}>{label}</Text>)}</View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{calendarDays.map(cell => { const dayExams = examsByDate.get(cell.key) ?? []; const selected = cell.key === selectedDate; return <TouchableOpacity key={cell.key} onPress={() => setSelectedDate(cell.key)} style={{ width: '14.285%', minHeight: 58, padding: 4, backgroundColor: selected ? '#eff6ff' : cell.current ? '#fff' : '#f8fafc', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#f1f5f9' }}><Text style={{ alignSelf: 'center', width: 24, height: 24, textAlign: 'center', paddingTop: 4, borderRadius: 12, backgroundColor: selected ? '#2563eb' : 'transparent', color: selected ? '#fff' : cell.current ? '#334155' : '#cbd5e1', fontSize: 11, fontWeight: '700' }}>{cell.date.getDate()}</Text>{dayExams.length > 0 && <View style={{ alignItems: 'center', marginTop: 3 }}><View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: dayExams.some(e => e.status === 'OPEN') ? '#16a34a' : '#2563eb' }} /><Text style={{ color: '#64748b', fontSize: 9, marginTop: 1 }}>{dayExams.length} ca</Text></View>}</TouchableOpacity> })}</View>
        </View>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 10 }}>Lịch thi ngày {selectedDate.split('-').reverse().join('/')}</Text>
        {selectedExams.length === 0 ? <View style={{ alignItems: 'center', paddingVertical: 28 }}><CalendarDays size={30} color="#cbd5e1" /><Text style={{ color: '#64748b', marginTop: 8 }}>Không có ca thi trong ngày này.</Text></View> : selectedExams.map(item => <ExamCard key={item.id} exam={item} />)}
      </>}
    </BackToTopScrollView>
  </StudentLayout>
}
