import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { router } from 'expo-router'
import { useAuthStore } from '../../store/authStore'
import { useLogout } from '../../hooks/useLogout'
import { useUIStore } from '../../store/uiStore'

type RouteKey = 'dashboard' | 'subjects' | 'exams' | 'scores' | 'notifications' | 'settings'

interface NavItem { label: string; icon: string; route: RouteKey; path: string }
interface NavGroup { title: string; items: NavItem[] }

const NAV_GROUPS: NavGroup[] = [
  { title: 'TỔNG QUAN', items: [{ label: 'Trang chủ', icon: '⊞', route: 'dashboard', path: '/(app)/(student)/dashboard' }] },
  { title: 'HỌC TẬP', items: [
    { label: 'Lớp học phần', icon: '📖', route: 'subjects', path: '/(app)/(student)/subjects' },
    { label: 'Bài thi', icon: '📋', route: 'exams', path: '/(app)/(student)/dashboard' },
  ]},
  { title: 'KẾT QUẢ', items: [{ label: 'Điểm số', icon: '🎓', route: 'scores', path: '/(app)/(student)/scores' }] },
  { title: 'THÔNG TIN', items: [
    { label: 'Thông báo', icon: '🔔', route: 'notifications', path: '/(app)/(student)/notifications' },
    { label: 'Cài đặt', icon: '⚙️', route: 'settings', path: '/(app)/(student)/dashboard' },
  ]},
]

function getInitials(name?: string | null) {
  if (!name) return 'SV'
  const parts = name.trim().split(/\s+/).filter(Boolean)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? '' : ''
  return `${first}${last}`.toUpperCase()
}

interface Props { activeRoute?: RouteKey }

export default function StudentSidebar({ activeRoute = 'dashboard' }: Props) {
  const user = useAuthStore((s) => s.user)
  const { handleLogout } = useLogout()
  const { toggleSidebar } = useUIStore()
  const initials = getInitials(user?.fullName)

  return (
    <View style={{ width: 220, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#f1f5f9', display: 'flex', flexDirection: 'column' }}>
      {/* Logo */}
      <View style={{ height: 64, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 10, shadowColor: '#2563eb', shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }}>
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>S</Text>
        </View>
        <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a', letterSpacing: -0.3 }}>SOES</Text>
        <View style={{ marginLeft: 8, backgroundColor: '#eff6ff', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#2563eb', textTransform: 'uppercase' }}>SV</Text>
        </View>
      </View>

      {/* Nav */}
      <ScrollView style={{ flex: 1, paddingHorizontal: 10, paddingTop: 12 }} showsVerticalScrollIndicator={false}>
        {NAV_GROUPS.map((group, gIdx) => (
          <View key={group.title} style={{ marginTop: gIdx > 0 ? 16 : 0 }}>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.8, textTransform: 'uppercase', paddingHorizontal: 10, marginBottom: 4 }}>
              {group.title}
            </Text>
            {group.items.map((item) => {
              const isActive = activeRoute === item.route
              return (
                <TouchableOpacity
                  key={item.label}
                  onPress={() => {
                    toggleSidebar()
                    router.push(item.path as never)
                  }}
                  style={{
                    flexDirection: 'row', alignItems: 'center', gap: 10,
                    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 2,
                    backgroundColor: isActive ? '#2563eb' : 'transparent',
                    shadowColor: isActive ? '#2563eb' : 'transparent',
                    shadowOpacity: isActive ? 0.25 : 0,
                    shadowRadius: isActive ? 8 : 0,
                    shadowOffset: { width: 0, height: 3 },
                  }}
                  activeOpacity={0.7}
                >
                  <Text style={{ fontSize: 15 }}>{item.icon}</Text>
                  <Text style={{ fontSize: 13, fontWeight: isActive ? '700' : '500', color: isActive ? '#fff' : '#475569' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>
        ))}
        <View style={{ height: 16 }} />
      </ScrollView>

      {/* User footer */}
      <View style={{ borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 12, padding: 10 }}>
          <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
            <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{initials}</Text>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>{user?.fullName ?? 'Sinh viên'}</Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }} numberOfLines={1}>{user?.studentCode ?? ''}</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={{ padding: 6 }}>
            <Text style={{ fontSize: 16, color: '#94a3b8' }}>↪</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  )
}
