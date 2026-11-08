import { Redirect, Stack, usePathname } from 'expo-router'
import { Pressable, Text, View } from 'react-native'
import { useAuthStore } from '../../../src/store/authStore'
import { StudentFaceEnrollmentContext, useStudentFaceEnrollment } from '../../../src/hooks/useStudentFaceEnrollment'
import { useLogout } from '../../../src/hooks/useLogout'
import { ScreenState } from '../../../src/components/ui/ScreenState'

// Guard được xử lý tại từng màn hình qua useRequireAuth
// Sidebar state được lưu trong uiStore (Zustand) — persist across navigation
export default function StudentLayout() {
  const { isInitialized, isAuthenticated, user } = useAuthStore()
  const active = isInitialized && isAuthenticated && user?.role === 'STUDENT'
  const { state, refresh } = useStudentFaceEnrollment(active)
  const { handleLogout, isLoading: isLoggingOut } = useLogout()
  const onEnrollmentPage = usePathname().endsWith('/face-enrollment')

  if (active && state === 'loading') return <ScreenState kind="loading" />
  if (active && state === 'error') {
    return <View style={{ flex: 1 }}>
      <ScreenState kind="error" message="Không thể kiểm tra trạng thái đăng ký khuôn mặt." onRetry={() => void refresh()} />
      <Pressable accessibilityRole="button" disabled={isLoggingOut} onPress={() => void handleLogout()} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center', margin: 24 }}>
        <Text style={{ color: '#2563eb', fontWeight: '700' }}>Đăng xuất</Text>
      </Pressable>
    </View>
  }
  if (active && state === 'required' && !onEnrollmentPage) {
    return <Redirect href="/(app)/(student)/face-enrollment" />
  }
  if (active && state === 'ready' && onEnrollmentPage) {
    return <Redirect href="/(app)/(student)/dashboard" />
  }
  return <StudentFaceEnrollmentContext.Provider value={{ refresh }}>
    <Stack screenOptions={{ headerShown: false }} />
  </StudentFaceEnrollmentContext.Provider>
}
