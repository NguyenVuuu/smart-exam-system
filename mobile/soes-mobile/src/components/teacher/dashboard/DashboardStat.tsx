import type { LucideIcon } from 'lucide-react-native'
import { StyleSheet, Text, View } from 'react-native'

interface Props { label: string; value: number | null; icon: LucideIcon }

export function DashboardStat({ label, value, icon: Icon }: Props) {
  return <View style={styles.card}>
    <View style={styles.icon}><Icon size={19} color="#2563eb" /></View>
    <Text style={styles.value}>{value ?? '—'}</Text>
    <Text style={styles.label}>{label}</Text>
  </View>
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, flexBasis: '46%', minWidth: 130, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 14, padding: 14 },
  icon: { width: 34, height: 34, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' },
  value: { fontSize: 24, fontWeight: '800', color: '#0f172a', marginTop: 8 },
  label: { fontSize: 12, color: '#64748b', marginTop: 3 },
})
