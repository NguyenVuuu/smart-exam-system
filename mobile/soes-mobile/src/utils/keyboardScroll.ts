import { Platform, type ScrollView } from 'react-native'

export type ScrollViewRef = React.ElementRef<typeof ScrollView>
export type TargetRef = { current: any }

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
 * Cuộn ScrollView đến ô input đang focus sao cho toàn bộ ô input và label
 * hiển thị trọn vẹn trong khung nhìn, không bị bàn phím che khuất.
 *
 * @param scrollView Ref instance của ScrollView
 * @param targetRef Ref của TextInput hoặc container chứa TextInput
 * @param extraOffset Khoảng cách đệm từ đỉnh ScrollView xuống ô input (mặc định 60px)
 */
export function scrollToFocusedInput(
  scrollView: ScrollViewRef | null,
  targetRef: TargetRef | null,
  extraOffset = 60,
) {
  if (!scrollView) return

  const delay = Platform.OS === 'ios' ? 120 : 180
  setTimeout(() => {
    if (targetRef?.current?.measureLayout) {
      try {
        targetRef.current.measureLayout(
          scrollView as any,
          (_left: number, top: number) => {
            scrollView?.scrollTo({
              y: Math.max(0, top - extraOffset),
              animated: true,
            })
          },
          () => {
            scrollView?.scrollToEnd({ animated: true })
          },
        )
      } catch {
        scrollView?.scrollToEnd({ animated: true })
      }
    } else {
      scrollView?.scrollToEnd({ animated: true })
    }
  }, delay)
}
