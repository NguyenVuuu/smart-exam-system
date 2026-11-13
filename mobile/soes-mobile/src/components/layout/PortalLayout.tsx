import type { Href } from 'expo-router'
import { useEffect, useState, type ReactNode } from 'react'
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
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

export const PORTAL_BACKGROUND_COLOR = '#f8fafc'

export function PortalLayout({ children, groups, activeRoute, portalLabel, notificationsHref }: Props) {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const closeSidebar = useUIStore((state) => state.setSidebarOpen)
  const { width } = useWindowDimensions()
  const insets = useSafeAreaInsets()
  const drawerWidth = Math.min(270, Math.max(190, width * 0.62))
  const [slide] = useState(() => new Animated.Value(-drawerWidth))
  const [dim] = useState(() => new Animated.Value(0))

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slide, { toValue: sidebarOpen ? 0 : -drawerWidth, duration: 220, useNativeDriver: true }),
      Animated.timing(dim, { toValue: sidebarOpen ? 1 : 0, duration: 220, useNativeDriver: true }),
    ]).start()
  }, [sidebarOpen, drawerWidth, slide, dim])

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <PortalTopBar notificationsHref={notificationsHref} />
    <View style={styles.content}>{children}</View>
    <View pointerEvents={sidebarOpen ? 'auto' : 'none'}
      style={[styles.drawerLayer, { top: insets.top, bottom: insets.bottom }]}>
      <Animated.View style={[styles.backdrop, { opacity: dim }]}>
        <Pressable accessibilityLabel="Đóng menu" onPress={() => closeSidebar(false)} style={StyleSheet.absoluteFill} />
      </Animated.View>
      <Animated.View style={[styles.drawer, { width: drawerWidth, transform: [{ translateX: slide }] }]}>
        <PortalSidebar groups={groups} activeRoute={activeRoute} portalLabel={portalLabel} />
      </Animated.View>
    </View>
  </SafeAreaView>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: PORTAL_BACKGROUND_COLOR },
  content: { flex: 1, minHeight: 0 },
  drawerLayer: { ...StyleSheet.absoluteFill, flexDirection: 'row', zIndex: 20 },
  backdrop: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  drawer: { height: '100%' },
})
