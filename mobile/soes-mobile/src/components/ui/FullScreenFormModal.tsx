import type { ReactNode } from 'react'
import { X } from 'lucide-react-native'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'

interface Props {
  title: string
  visible: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  closeDisabled?: boolean
}

export function FullScreenFormModal({ title, visible, onClose, children, footer, closeDisabled }: Props) {
  return <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
    <SafeAreaProvider>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} disabled={closeDisabled} style={styles.close}>
              <X size={22} color="#334155" />
            </Pressable>
          </View>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets>
            {children}
          </ScrollView>
          {footer && <View style={styles.footer}>{footer}</View>}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  </Modal>
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 56, paddingLeft: 16, paddingRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { flex: 1, color: '#0f172a', fontSize: 18, fontWeight: '800' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 }, content: { padding: 16, paddingBottom: 32 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
})
