import { Keyboard, Platform, type ScrollView, type TextInput } from 'react-native'

export type ScrollViewRef = React.ElementRef<typeof ScrollView>
export type TargetRef = { current: React.ElementRef<typeof TextInput> | null }

/**
 * Cuộn ScrollView đến toạ độ Y của ô input hoặc section (lấy từ onLayout).
 * Đảm bảo ô input cùng nhãn (label) hiển thị trọn vẹn ở nửa trên màn hình.
 *
 * @param scrollView Ref instance của ScrollView
 * @param y Toạ độ layout Y của component
 * @param extraOffset Khoảng đệm từ đỉnh màn hình xuống (mặc định 16px)
 */
export function scrollToY(
  scrollView: ScrollViewRef | null,
  y: number,
  extraOffset = 16,
) {
  if (!scrollView) return

  const delay = Platform.OS === 'ios' ? 100 : 160
  setTimeout(() => {
    scrollView.scrollTo({
      y: Math.max(0, y - extraOffset),
      animated: true,
    })
  }, delay)
}

/**
 * Cuộn ô đang focus lên đầu vùng nhìn để thấy cả ô nhập nhiều dòng.
 *
 * @param scrollView Ref instance của ScrollView
 * @param targetRef Ref của TextInput
 * @param extraOffset Khoảng đệm từ đầu vùng cuộn (mặc định 16px)
 */
export function scrollToFocusedInput(
  scrollView: ScrollViewRef | null,
  targetRef: TargetRef | null,
  extraOffset = 16,
) {
  if (!scrollView || !targetRef?.current) return

  const delay = Keyboard.isVisible() ? 80 : 350
  setTimeout(() => {
    const input = targetRef.current
    const content = scrollView.getInnerViewRef()
    if (!input?.isFocused() || !content) return
    input.measureLayout(content, (_left, top) => {
      if (input.isFocused()) scrollView.scrollTo({ y: Math.max(0, top - extraOffset), animated: true })
    })
  }, delay)
}
