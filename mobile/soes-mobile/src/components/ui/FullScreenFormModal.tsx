import { createContext, useContext, useRef, type ElementRef, type ReactNode } from 'react'
import { X } from 'lucide-react-native'
import { Animated, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context'
import { useKeyboardBottomOffset } from '../../hooks/useKeyboardBottomOffset'
import { scrollToY as scrollToLayoutY } from '../../utils/keyboardScroll'

interface ModalScrollContextType {
  scrollToY: (y: number, extraOffset?: number) => void
  scrollRef: React.RefObject<ElementRef<typeof ScrollView> | null>
}

const ModalScrollContext = createContext<ModalScrollContextType>({
  scrollToY: () => {},
  scrollRef: { current: null },
})

export function useModalScroll() {
  return useContext(ModalScrollContext)
}

interface Props {
  title: string
  visible: boolean
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  closeDisabled?: boolean
}

function ModalInner({ title, onClose, children, footer, closeDisabled }: Omit<Props, 'visible'>) {
  const scrollRef = useRef<ElementRef<typeof ScrollView>>(null)
  const { animatedOffset, isKeyboardOpen } = useKeyboardBottomOffset({ accountForBottomInset: true })

  const scrollToY = (y: number, extraOffset = 16) => {
    scrollToLayoutY(scrollRef.current, y, extraOffset)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View
        style={[
          styles.safe,
          Platform.OS === 'ios' && { paddingBottom: animatedOffset },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Đóng" onPress={onClose} disabled={closeDisabled} style={styles.close}>
            <X size={22} color="#334155" />
          </Pressable>
        </View>
        <ModalScrollContext.Provider value={{ scrollToY, scrollRef }}>
          <ScrollView
            ref={scrollRef}
            style={styles.scroll}
            contentContainerStyle={[styles.content, isKeyboardOpen && styles.contentKeyboardOpen]}
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets={false}
          >
            {children}
          </ScrollView>
        </ModalScrollContext.Provider>
        {footer && <View style={styles.footer}>{footer}</View>}
      </Animated.View>
    </SafeAreaView>
  )
}

export function FullScreenFormModal({ title, visible, onClose, children, footer, closeDisabled }: Props) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="fullScreen" onRequestClose={onClose}>
      <SafeAreaProvider>
        <ModalInner
          title={title}
          onClose={onClose}
          footer={footer}
          closeDisabled={closeDisabled}
        >
          {children}
        </ModalInner>
      </SafeAreaProvider>
    </Modal>
  )
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: { minHeight: 56, paddingLeft: 16, paddingRight: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  title: { flex: 1, color: '#0f172a', fontSize: 18, fontWeight: '800' },
  close: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  contentKeyboardOpen: { paddingBottom: 240 },
  footer: { padding: 16, borderTopWidth: 1, borderTopColor: '#e2e8f0' },
})
