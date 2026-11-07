import { useState } from 'react'
import { CalendarDays, List } from 'lucide-react-native'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { InvigilationCard } from '../../components/teacher/invigilation/InvigilationCard'
import { InvigilationCalendar } from '../../components/teacher/invigilation/InvigilationCalendar'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { SearchField } from '../../components/ui/SearchField'
import { PaginationControls } from '../../components/ui/PaginationControls'
import { useTeacherInvigilation } from '../../hooks/useTeacherInvigilation'
import type { InvigilationStatus } from '../../types/teacher-invigilation.types'

const filters: { key: InvigilationStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' }, { key: 'SCHEDULED', label: 'Sắp tới' },
  { key: 'OPEN', label: 'Đang diễn ra' }, { key: 'CLOSED', label: 'Đã kết thúc' },
]

export function TeacherInvigilationPage() {
  const schedule = useTeacherInvigilation()
  const [view, setView] = useState<'list' | 'calendar'>('calendar')
  return <View style={styles.root}>
    <View style={styles.header}>
      <ScreenHeader showBack title="Lịch coi thi" description="Ca thi bạn tạo hoặc được phân công coi thi" />
      <View style={styles.switcher}>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: view === 'calendar' }} onPress={() => setView('calendar')} style={[styles.switchButton, view === 'calendar' && styles.switchActive]}>
          <CalendarDays size={16} color={view === 'calendar' ? '#fff' : '#475569'} /><Text style={[styles.switchText, view === 'calendar' && styles.switchTextActive]}>Lịch tháng</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityState={{ selected: view === 'list' }} onPress={() => setView('list')} style={[styles.switchButton, view === 'list' && styles.switchActive]}>
          <List size={16} color={view === 'list' ? '#fff' : '#475569'} /><Text style={[styles.switchText, view === 'list' && styles.switchTextActive]}>Danh sách</Text>
        </Pressable>
      </View>
      {view === 'list' && <>
      <SearchField value={schedule.keyword} onChangeText={schedule.setKeyword} placeholder="Tìm tên ca thi hoặc môn học" />
      <View style={styles.filters}>{filters.map((item) => <Pressable key={item.key} accessibilityRole="button"
        onPress={() => schedule.setStatus(item.key)} style={[styles.filter, schedule.status === item.key && styles.selected]}>
        <Text style={[styles.filterText, schedule.status === item.key && styles.selectedText]}>{item.label}</Text></Pressable>)}</View>
      </>}
    </View>
    {view === 'calendar' ? <InvigilationCalendar /> : schedule.loading && !schedule.items.length ? <ScreenState kind="loading" /> : schedule.error && !schedule.items.length ?
      <ScreenState kind="error" onRetry={schedule.retry} /> : <FlatList key={schedule.page} data={schedule.items} keyExtractor={(item) => item.id}
        renderItem={({ item }) => <InvigilationCard assignment={item} />} contentContainerStyle={styles.list}
        ListEmptyComponent={<ScreenState kind="empty" message="Không có ca coi thi phù hợp." />}
        ListFooterComponent={<>{schedule.error && <Text style={styles.error}>Không thể tải ca thi.</Text>}
          <PaginationControls page={schedule.page} totalPages={schedule.totalPages} loading={schedule.loading} onPage={schedule.goToPage} /></>}
        refreshControl={<RefreshControl refreshing={schedule.refreshing} onRefresh={schedule.refresh} />}
        />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 4 },
  switcher: { alignSelf: 'flex-start', flexDirection: 'row', gap: 7, marginBottom: 12 },
  switchButton: { minHeight: 38, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 11, borderRadius: 9, borderWidth: 1, borderColor: '#cbd5e1' },
  switchActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' }, switchText: { color: '#475569', fontSize: 12, fontWeight: '700' }, switchTextActive: { color: '#fff' },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filter: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center' },
  selected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' }, filterText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  selectedText: { color: '#1d4ed8' }, list: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
})
