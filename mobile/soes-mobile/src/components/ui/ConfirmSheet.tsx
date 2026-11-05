import { Modal, Pressable, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  visible: boolean
  title: string
  message: string
  busy?: boolean
  confirmLabel?: string
  destructive?: boolean
  onCancel: () => void
  onConfirm: () => void
}

export function ConfirmSheet({ visible, title, message, busy, confirmLabel = 'Xác nhận', destructive, onCancel, onConfirm }: Props) {
  return <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
    <SafeAreaView style={styles.overlay}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>
        <View style={styles.actions}>
          <Pressable disabled={busy} onPress={onCancel} style={[styles.button, styles.cancel]}><Text style={styles.cancelText}>Hủy</Text></Pressable>
          <Pressable disabled={busy} onPress={onConfirm} style={[styles.button, { backgroundColor: destructive ? '#dc2626' : '#2563eb' }]}>
            <Text style={styles.confirmText}>{busy ? 'Đang xử lý...' : confirmLabel}</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  </Modal>
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, backgroundColor: 'rgba(15, 23, 42, 0.5)' },
  sheet: { width: '100%', maxWidth: 440, alignSelf: 'center', padding: 20, borderRadius: 18, backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  message: { marginTop: 10, fontSize: 14, lineHeight: 21, color: '#475569' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 22 },
  button: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  cancel: { backgroundColor: '#f1f5f9' }, cancelText: { color: '#334155', fontWeight: '700' },
  confirmText: { color: '#fff', fontWeight: '700', textAlign: 'center' },
})
