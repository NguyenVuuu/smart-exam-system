import { View, Text, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'

function getInitials(name?: string | null) {
  if (!name) return 'SV'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}

export default function StudentTopBar({ onToggleSidebar }: { onToggleSidebar?: () => void }) {
  const user = useAuthStore((s) => s.user)
  const toggleSidebar = useUIStore((s) => s.toggleSidebar)
  const initials = getInitials(user?.fullName)

  const handleToggle = onToggleSidebar ?? toggleSidebar

  return (
    <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', backgroundColor: '#fff', paddingHorizontal: 16 }}>
      <TouchableOpacity
        onPress={handleToggle}
        style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#f8fafc' }}
      >
        <Text style={{ fontSize: 16, color: '#475569' }}>☰</Text>
      </TouchableOpacity>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* Bell */}
        <View style={{ width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#f8fafc' }}>
          <Text style={{ fontSize: 16 }}>🔔</Text>
        </View>

        {/* Avatar + name */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } }}>
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>{initials}</Text>
          </View>
          <View>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{user?.fullName}</Text>
            <Text style={{ fontSize: 11, color: '#64748b' }}>{user?.studentCode}</Text>
          </View>
        </View>
      </View>
    </View>
  )
}
