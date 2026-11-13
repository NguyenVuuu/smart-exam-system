import { ArrowLeftRight, LogOut } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { useLogout } from '../../hooks/useLogout'
import { useSwitchRole } from '../../hooks/useSwitchRole'
import { useAuthStore } from '../../store/authStore'
import { ROLE_LABEL } from '../../utils/role'

export function PortalUserFooter() {
  const user = useAuthStore((state) => state.user)
  const { handleLogout, isLoading } = useLogout()
  const { switchRole, isSwitching } = useSwitchRole()
  const initials = user?.fullName?.trim().split(/\s+/).slice(-2).map((part) => part[0]).join('').toUpperCase() || 'SO'

  return <View>
    {(user?.availableRoles?.length ?? 0) > 1 && <Pressable accessibilityRole="button"
      disabled={isSwitching} onPress={() => void switchRole()} style={styles.switchRole}>
      <ArrowLeftRight size={18} color="#2563eb" /><Text style={styles.switchText}>{isSwitching ? 'Đang chuyển...' : 'Chuyển vai trò'}</Text>
    </Pressable>}
    <View style={styles.footer}>
    <View style={styles.avatar}><Text style={styles.initials}>{initials}</Text></View>
    <View style={styles.identity}>
      <Text style={styles.name} numberOfLines={1}>{user?.fullName ?? 'Tài khoản'}</Text>
      <Text style={styles.role} numberOfLines={1}>{user ? ROLE_LABEL[user.role] : ''}</Text>
    </View>
    <Pressable accessibilityLabel="Đăng xuất" disabled={isLoading} onPress={handleLogout} hitSlop={8} style={styles.logout}>
      <LogOut size={20} color="#64748b" />
    </Pressable>
    </View>
  </View>
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '700', fontSize: 12 },
  identity: { flex: 1, minWidth: 0 },
  name: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  role: { color: '#64748b', fontSize: 11, marginTop: 2 },
  logout: { minWidth: 36, minHeight: 40, alignItems: 'center', justifyContent: 'center' },
  switchRole: { minHeight: 44, marginHorizontal: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, borderRadius: 10, backgroundColor: '#eff6ff' },
  switchText: { color: '#1d4ed8', fontWeight: '700', fontSize: 13 },
})
