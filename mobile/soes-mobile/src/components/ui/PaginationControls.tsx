import { ChevronLeft, ChevronRight } from 'lucide-react-native'
import { Pressable, StyleSheet, Text, View } from 'react-native'

interface Props { page: number; totalPages: number; loading?: boolean; onPage: (page: number) => void }

export function PaginationControls({ page, totalPages, loading = false, onPage }: Props) {
  if (totalPages <= 1) return null
  return <View style={styles.root}>
    <Pressable accessibilityRole="button" accessibilityLabel="Trang trước" disabled={loading || page <= 1}
      onPress={() => onPage(page - 1)} style={[styles.button, (loading || page <= 1) && styles.disabled]}>
      <ChevronLeft size={18} color="#2563eb" /><Text style={styles.action}>Trước</Text>
    </Pressable>
    <Text style={styles.page}>Trang {page} / {totalPages}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel="Trang sau" disabled={loading || page >= totalPages}
      onPress={() => onPage(page + 1)} style={[styles.button, (loading || page >= totalPages) && styles.disabled]}>
      <Text style={styles.action}>Sau</Text><ChevronRight size={18} color="#2563eb" />
    </Pressable>
  </View>
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, paddingVertical: 12 },
  button: { minHeight: 44, minWidth: 84, paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#eff6ff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  disabled: { opacity: 0.4 }, action: { color: '#2563eb', fontWeight: '700', fontSize: 13 },
  page: { color: '#475569', fontSize: 12, fontWeight: '600' },
})
