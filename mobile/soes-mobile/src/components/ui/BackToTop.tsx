import { forwardRef, useRef, useState, type ReactElement, type Ref } from 'react'
import { FlatList, Pressable, ScrollView, StyleSheet, View,
  type FlatListProps, type NativeScrollEvent, type NativeSyntheticEvent, type ScrollViewInstance, type ScrollViewProps,
  type StyleProp, type ViewStyle } from 'react-native'
import { ArrowUp } from 'lucide-react-native'

const SHOW_AFTER = 500

function useBackToTop() {
  const [visible, setVisible] = useState(false)
  const lastVisible = useRef(false)
  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = event.nativeEvent.contentOffset.y > SHOW_AFTER
    if (next !== lastVisible.current) {
      lastVisible.current = next
      setVisible(next)
    }
  }
  return { visible, onScroll }
}

function BackToTopButton({ onPress }: { onPress: () => void }) {
  return <Pressable accessibilityRole="button" accessibilityLabel="Lên đầu trang" accessibilityHint="Cuộn về đầu trang"
    onPress={onPress} style={styles.button} hitSlop={8}>
    <ArrowUp size={22} color="#fff" strokeWidth={2.5} />
  </Pressable>
}

function withBottomSpace(style: StyleProp<ViewStyle>) {
  const paddingBottom = StyleSheet.flatten(style)?.paddingBottom
  return [style, { paddingBottom: Math.max(80, typeof paddingBottom === 'number' ? paddingBottom : 0) }]
}

export const BackToTopScrollView = forwardRef<ScrollViewInstance, ScrollViewProps>(function BackToTopScrollView(
  { onScroll, scrollEventThrottle, contentContainerStyle, ...props }, forwardedRef,
) {
  const internalRef = useRef<ScrollViewInstance>(null)
  const { visible, onScroll: trackScroll } = useBackToTop()
  const assignRef = (instance: ScrollViewInstance | null) => {
    internalRef.current = instance
    if (typeof forwardedRef === 'function') forwardedRef(instance)
    else if (forwardedRef) forwardedRef.current = instance
  }
  return <View style={styles.container}>
    <ScrollView {...props} ref={assignRef} contentContainerStyle={withBottomSpace(contentContainerStyle)}
      onScroll={(event) => { trackScroll(event); onScroll?.(event) }}
      scrollEventThrottle={scrollEventThrottle ?? 16} />
    {visible && <BackToTopButton onPress={() => internalRef.current?.scrollTo({ y: 0, animated: true })} />}
  </View>
})

function BackToTopFlatListInner<Item>(
  { onScroll, scrollEventThrottle, contentContainerStyle, ...props }: FlatListProps<Item>, forwardedRef: Ref<FlatList<Item>>,
) {
  const internalRef = useRef<FlatList<Item>>(null)
  const { visible, onScroll: trackScroll } = useBackToTop()
  const assignRef = (instance: FlatList<Item> | null) => {
    internalRef.current = instance
    if (typeof forwardedRef === 'function') forwardedRef(instance)
    else if (forwardedRef) forwardedRef.current = instance
  }
  return <View style={styles.container}>
    <FlatList {...props} ref={assignRef} contentContainerStyle={withBottomSpace(contentContainerStyle)}
      onScroll={(event) => { trackScroll(event); onScroll?.(event) }}
      scrollEventThrottle={scrollEventThrottle ?? 16} />
    {visible && <BackToTopButton onPress={() => internalRef.current?.scrollToOffset({ offset: 0, animated: true })} />}
  </View>
}

export const BackToTopFlatList = forwardRef(BackToTopFlatListInner) as <Item>(
  props: FlatListProps<Item> & { ref?: Ref<FlatList<Item>> },
) => ReactElement

const styles = StyleSheet.create({
  container: { flex: 1, minHeight: 0 },
  button: { position: 'absolute', right: 16, bottom: 20, width: 48, height: 48,
    borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563eb',
    elevation: 5, shadowColor: '#0f172a', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } },
})
