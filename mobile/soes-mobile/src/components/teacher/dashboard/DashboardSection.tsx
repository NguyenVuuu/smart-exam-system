import type { Href } from 'expo-router'
import { router } from 'expo-router'
import { ArrowRight } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'

interface Props { title: string; href: Href; failed: boolean; emptyText: string; rows: { id: string; title: string; subtitle: string; href?: Href }[] }

export function DashboardSection({ title, href, failed, emptyText, rows }: Props) {
  return <SectionCard title={title}>
    {failed ? <Text style={styles.muted}>Không thể tải dữ liệu mục này.</Text> : rows.length === 0 ? <Text style={styles.muted}>{emptyText}</Text> :
      rows.map((row) => <Pressable key={row.id} onPress={() => router.push(row.href ?? href)} style={styles.row}>
        <View style={styles.rowText}><Text style={styles.title} numberOfLines={2}>{row.title}</Text><Text style={styles.subtitle} numberOfLines={1}>{row.subtitle}</Text></View>
        <ArrowRight size={17} color="#94a3b8" />
      </Pressable>)}
    <Pressable accessibilityRole="button" onPress={() => router.push(href)} style={styles.more}><Text style={styles.moreText}>Xem tất cả</Text><ArrowRight size={15} color="#2563eb" /></Pressable>
  </SectionCard>
}

const styles = StyleSheet.create({
  muted: { color: '#64748b', fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', minHeight: 54 },
  rowText: { flex: 1, minWidth: 0 }, title: { color: '#0f172a', fontSize: 14, fontWeight: '600' },
  subtitle: { color: '#64748b', fontSize: 12, marginTop: 3 },
  more: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', minHeight: 44, marginTop: 5 },
  moreText: { color: '#2563eb', fontSize: 13, fontWeight: '700' },
})
