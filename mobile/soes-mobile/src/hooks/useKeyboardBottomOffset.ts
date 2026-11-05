import { useEffect, useRef, useState } from 'react'
import { Animated, Keyboard, Platform, type KeyboardEvent } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface Options {
  /**
   * Nếu component nằm trong SafeAreaView có edges={['bottom']},
   * trừ bớt insets.bottom vì SafeAreaView đã chừa sẵn khoảng đệm này.
   * Mặc định: true
   */
  accountForBottomInset?: boolean
  /**
   * Khoảng đệm thêm nếu cần (px)
   */
  extraOffset?: number
}

/**
 * Hook quản lý khoảng nâng giao diện trên iOS khi bàn phím ảo xuất hiện.
 *
 * - Trên iOS: Bàn phím trượt lên như một lớp overlay đè lên màn hình. Hook này
 *   lắng nghe sự kiện `keyboardWillShow`/`keyboardWillHide` của iOS và animate
 *   khoảng bù `animatedOffset` đồng bộ 100% với animation của bàn phím.
 * - Trên Android: Hệ thống đã có `"softwareKeyboardLayoutMode": "resize"`,
 *   OS tự động co giãn cửa sổ ứng dụng nên offset trả về là 0 để tránh đẩy 2 lần.
 */
export function useKeyboardBottomOffset(options: Options = {}) {
  const { accountForBottomInset = true, extraOffset = 0 } = options
  const insets = useSafeAreaInsets()
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const animatedOffset = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (Platform.OS !== 'ios') return

    const handleShow = (e: KeyboardEvent) => {
      const rawHeight = e.endCoordinates.height
      const bottomInset = accountForBottomInset ? insets.bottom : 0
      const targetOffset = Math.max(0, rawHeight - bottomInset + extraOffset)

      setKeyboardHeight(targetOffset)

      Animated.timing(animatedOffset, {
        toValue: targetOffset,
        duration: e.duration && e.duration > 0 ? e.duration : 250,
        useNativeDriver: false,
      }).start()
    }

    const handleHide = (e: KeyboardEvent) => {
      setKeyboardHeight(0)

      Animated.timing(animatedOffset, {
        toValue: 0,
        duration: e.duration && e.duration > 0 ? e.duration : 250,
        useNativeDriver: false,
      }).start()
    }

    const showSub = Keyboard.addListener('keyboardWillShow', handleShow)
    const hideSub = Keyboard.addListener('keyboardWillHide', handleHide)

    return () => {
      showSub.remove()
      hideSub.remove()
    }
  }, [accountForBottomInset, insets.bottom, extraOffset, animatedOffset])

  return {
    keyboardHeight,
    animatedOffset,
    isKeyboardOpen: keyboardHeight > 0,
  }
}
