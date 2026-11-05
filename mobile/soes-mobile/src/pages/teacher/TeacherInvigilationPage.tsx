import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { InvigilationCard } from '../../components/teacher/invigilation/InvigilationCard'
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
  return <View style={styles.root}>
    <View style={styles.header}>
      <ScreenHeader title="Lịch coi thi" description="Ca thi bạn tạo hoặc được phân công coi thi" />
      <SearchField value={schedule.keyword} onChangeText={schedule.setKeyword} placeholder="Tìm tên ca thi hoặc môn học" />
      <View style={styles.filters}>{filters.map((item) => <Pressable key={item.key} accessibilityRole="button"
        onPress={() => schedule.setStatus(item.key)} style={[styles.filter, schedule.status === item.key && styles.selected]}>
        <Text style={[styles.filterText, schedule.status === item.key && styles.selectedText]}>{item.label}</Text></Pressable>)}</View>
    </View>
    {schedule.loading && !schedule.items.length ? <ScreenState kind="loading" /> : schedule.error && !schedule.items.length ?
      <ScreenState kind="error" onRetry={schedule.retry} /> : <FlatList data={schedule.items} keyExtractor={(item) => item.id}
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
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  filter: { minHeight: 40, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#cbd5e1', justifyContent: 'center' },
  selected: { backgroundColor: '#eff6ff', borderColor: '#2563eb' }, filterText: { color: '#475569', fontSize: 12, fontWeight: '600' },
  selectedText: { color: '#1d4ed8' }, list: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
})
