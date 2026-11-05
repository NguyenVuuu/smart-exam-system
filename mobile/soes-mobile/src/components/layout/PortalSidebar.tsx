import { router } from 'expo-router'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { useUIStore } from '../../store/uiStore'
import type { NavigationGroup } from '../../navigation/navigation.types'
import { PortalUserFooter } from './PortalUserFooter'
import { SystemLogo } from '../ui/SystemLogo'

interface Props { groups: NavigationGroup[]; activeRoute: string; portalLabel: string }

export function PortalSidebar({ groups, activeRoute, portalLabel }: Props) {
  const closeSidebar = useUIStore((state) => state.setSidebarOpen)

  return <View style={styles.root}>
    <View style={styles.brand}>
      <SystemLogo />
      <Text style={styles.brandName}>SOES</Text>
      <Text style={styles.portalLabel}>{portalLabel}</Text>
    </View>
    <ScrollView style={styles.menu} contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
      {groups.map((group) => <View key={group.title} style={styles.group}>
        <Text style={styles.groupTitle}>{group.title}</Text>
        {group.items.map((item) => {
          const active = item.key === activeRoute
          const Icon = item.icon
          return <Pressable key={item.key} accessibilityRole="button" accessibilityState={{ selected: active }}
            style={[styles.item, active && styles.itemActive]} onPress={() => { closeSidebar(false); router.push(item.href) }}>
            <Icon size={19} color={active ? '#fff' : '#475569'} />
            <Text numberOfLines={1} style={[styles.itemLabel, active && styles.itemLabelActive]}>{item.label}</Text>
          </Pressable>
        })}
      </View>)}
    </ScrollView>
    <PortalUserFooter />
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff', borderRightWidth: 1, borderRightColor: '#e2e8f0' },
  brand: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#e2e8f0', gap: 9 },
  brandName: { fontSize: 17, fontWeight: '800', color: '#0f172a' },
  portalLabel: { color: '#2563eb', backgroundColor: '#eff6ff', fontSize: 10, fontWeight: '700', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, overflow: 'hidden' },
  menu: { flex: 1 }, menuContent: { paddingHorizontal: 10, paddingVertical: 12 },
  group: { marginBottom: 14 }, groupTitle: { fontSize: 10, textTransform: 'uppercase', fontWeight: '700', color: '#94a3b8', paddingHorizontal: 10, marginBottom: 5 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 12, borderRadius: 10, marginBottom: 2 },
  itemActive: { backgroundColor: '#2563eb' }, itemLabel: { flex: 1, color: '#475569', fontWeight: '500', fontSize: 13 }, itemLabelActive: { color: '#fff', fontWeight: '700' },
})
