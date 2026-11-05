import { Bell, Menu } from 'lucide-react-native'
import { router, type Href } from 'expo-router'
import { Platform, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import { useAuthStore } from '../../store/authStore'
import { useUIStore } from '../../store/uiStore'
import { SystemLogo } from '../ui/SystemLogo'

interface Props { notificationsHref: Href }

export function PortalTopBar({ notificationsHref }: Props) {
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const name = useAuthStore((state) => state.user?.fullName)
  const { width } = useWindowDimensions()

  return <View style={styles.root}>
    <Pressable accessibilityLabel="Mở menu" onPress={toggleSidebar} style={styles.iconButton}><Menu size={21} color="#334155" /></Pressable>
    <SystemLogo size={28} />
    <Text style={styles.title} numberOfLines={1}>SOES</Text>
    {(Platform.OS === 'android' || width > 390) && <Text style={[styles.name, Platform.OS === 'android' && styles.androidName]} numberOfLines={1}>{name}</Text>}
    <Pressable accessibilityLabel="Thông báo" onPress={() => router.push(notificationsHref)} style={styles.iconButton}><Bell size={21} color="#334155" /></Pressable>
  </View>
}

const styles = StyleSheet.create({
  root: { height: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  iconButton: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#f8fafc' },
  title: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  name: { marginLeft: 'auto', flexShrink: 1, color: '#475569', fontSize: 12 },
  androidName: { flex: 1, minWidth: 0, marginLeft: 0, textAlign: 'right' },
})
