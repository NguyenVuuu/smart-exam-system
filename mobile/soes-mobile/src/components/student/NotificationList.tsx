import { View, Text } from 'react-native'
import type { NotificationItem } from '../../types/dashboard.types'

const DOT: Record<string, string> = {
  green:  '#22c55e',
  yellow: '#f59e0b',
  red:    '#ef4444',
}

export default function NotificationList({ notifications }: { notifications: NotificationItem[] }) {
  return (
    <View style={{
      flex: 1, backgroundColor: '#fff', borderRadius: 16, padding: 14,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 10,
      shadowOffset: { width: 0, height: 2 }, borderWidth: 1, borderColor: '#f1f5f9',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 }}>
        <View style={{ width: 28, height: 28, borderRadius: 8, backgroundColor: '#fef9c3', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14 }}>🔔</Text>
        </View>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>Thông báo</Text>
      </View>

      {notifications.length === 0 ? (
        <View style={{ paddingVertical: 12, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>Không có thông báo mới.</Text>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {notifications.map((notif) => (
            <View key={notif.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10 }}>
              <View style={{ marginTop: 4, width: 8, height: 8, borderRadius: 4, backgroundColor: DOT[notif.dot], flexShrink: 0 }} />
              <Text style={{ flex: 1, fontSize: 12, color: '#1e293b', lineHeight: 17 }} numberOfLines={2}>
                {notif.message}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  )
}
