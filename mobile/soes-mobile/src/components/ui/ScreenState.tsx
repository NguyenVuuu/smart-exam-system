import { AlertCircle, Inbox, RefreshCw } from 'lucide-react-native'
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native'

interface Props { kind: 'loading' | 'empty' | 'error'; message?: string; onRetry?: () => void }

export function ScreenState({ kind, message, onRetry }: Props) {
  if (kind === 'loading') return <View style={styles.root}><ActivityIndicator size="large" color="#2563eb" /><Text style={styles.message}>Đang tải dữ liệu...</Text></View>
  const Icon = kind === 'empty' ? Inbox : AlertCircle
  return <View style={styles.root}>
    <Icon size={30} color={kind === 'error' ? '#dc2626' : '#94a3b8'} />
    <Text style={styles.message}>{message ?? (kind === 'empty' ? 'Chưa có dữ liệu.' : 'Không thể tải dữ liệu.')}</Text>
    {kind === 'error' && onRetry && <Pressable onPress={onRetry} style={styles.retry} accessibilityRole="button">
      <RefreshCw size={16} color="#2563eb" /><Text style={styles.retryText}>Thử lại</Text>
    </Pressable>}
  </View>
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 180, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  message: { textAlign: 'center', color: '#64748b', lineHeight: 20, fontSize: 14 },
  retry: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, paddingHorizontal: 14, borderRadius: 10, backgroundColor: '#eff6ff' },
  retryText: { color: '#2563eb', fontWeight: '700' },
})
