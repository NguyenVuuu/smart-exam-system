import { CheckCheck } from 'lucide-react-native'
import { router } from 'expo-router'
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native'
import { TeacherNotificationCard } from '../../components/teacher/notifications/TeacherNotificationCard'
import { ScreenHeader } from '../../components/ui/ScreenHeader'
import { ScreenState } from '../../components/ui/ScreenState'
import { PaginationControls } from '../../components/ui/PaginationControls'
import { useTeacherNotifications } from '../../hooks/useTeacherNotifications'
import { resolveTeacherNotificationLink } from '../../navigation/teacher-notification-links'
import type { TeacherNotification } from '../../types/teacher-notifications.types'

export function TeacherNotificationsPage() {
  const notifications = useTeacherNotifications()
  function open(item: TeacherNotification) {
    void notifications.markRead(item)
    const target = resolveTeacherNotificationLink(item.link, item.title)
    if (target) router.push(target)
  }
  return <View style={styles.root}>
    <View style={styles.header}>
      <ScreenHeader showBack title="Thông báo" description={`${notifications.unreadCount} thông báo chưa đọc`} />
      <Pressable accessibilityRole="button" disabled={notifications.busy || !notifications.unreadCount}
        onPress={() => { void notifications.markAllRead() }} style={styles.action}>
        <CheckCheck size={17} color="#2563eb" /><Text style={styles.actionText}>Đánh dấu tất cả đã đọc</Text>
      </Pressable>
    </View>
    {notifications.loading && !notifications.items.length ? <ScreenState kind="loading" /> : notifications.error && !notifications.items.length ?
      <ScreenState kind="error" onRetry={notifications.retry} /> : <FlatList key={notifications.page} data={notifications.items} keyExtractor={(item) => item.id}
        renderItem={({ item }) => <TeacherNotificationCard item={item} onPress={() => open(item)} hasTarget={Boolean(resolveTeacherNotificationLink(item.link, item.title))} />}
        contentContainerStyle={styles.list} ListEmptyComponent={<ScreenState kind="empty" message="Bạn chưa có thông báo nào." />}
        ListFooterComponent={<>{notifications.error && <Text style={styles.error}>Không thể tải thông báo.</Text>}
          <PaginationControls page={notifications.page} totalPages={notifications.totalPages} loading={notifications.loading} onPage={notifications.goToPage} /></>}
        refreshControl={<RefreshControl refreshing={notifications.refreshing} onRefresh={notifications.refresh} />}
        />}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1 }, header: { padding: 16, paddingBottom: 4 }, action: { minHeight: 44, alignSelf: 'flex-start', flexDirection: 'row', gap: 8, alignItems: 'center' },
  actionText: { color: '#2563eb', fontWeight: '700', fontSize: 13 }, list: { flexGrow: 1, paddingHorizontal: 16, paddingTop: 10, paddingBottom: 36 },
  error: { color: '#b91c1c', textAlign: 'center', padding: 12 },
})
