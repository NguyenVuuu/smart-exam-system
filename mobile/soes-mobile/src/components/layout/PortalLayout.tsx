import type { Href } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import type { NavigationGroup } from '../../navigation/navigation.types'
import { useUIStore } from '../../store/uiStore'
import { PortalSidebar } from './PortalSidebar'
import { PortalTopBar } from './PortalTopBar'

interface Props {
  children: ReactNode
  groups: NavigationGroup[]
  activeRoute: string
  portalLabel: string
  notificationsHref: Href
}

export function PortalLayout({ children, groups, activeRoute, portalLabel, notificationsHref }: Props) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const closeSidebar = useUIStore((state) => state.setSidebarOpen)
  const { width } = useWindowDimensions()
  const drawerWidth = Math.min(280, Math.max(0, width - 48))

  return <SafeAreaView style={styles.safe}>
    <PortalTopBar notificationsHref={notificationsHref} />
    <View style={styles.content}>{children}</View>
    {sidebarOpen && <View style={styles.drawerLayer}>
      <Pressable accessibilityLabel="Đóng menu" onPress={() => closeSidebar(false)} style={styles.backdrop} />
      <View style={[styles.drawer, { width: drawerWidth }]}><PortalSidebar groups={groups} activeRoute={activeRoute} portalLabel={portalLabel} /></View>
    </View>}
  </SafeAreaView>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  content: { flex: 1, minHeight: 0 },
  drawerLayer: { ...StyleSheet.absoluteFill, flexDirection: 'row', zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  drawer: { flex: 1, maxWidth: '85%' },
})
