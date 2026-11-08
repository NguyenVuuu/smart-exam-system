import { Redirect, Stack, usePathname } from 'expo-router'
import { useAuthStore } from '../../../src/store/authStore'
import { StudentFaceEnrollmentContext, useStudentFaceEnrollment } from '../../../src/hooks/useStudentFaceEnrollment'
import { ScreenState } from '../../../src/components/ui/ScreenState'

// Guard được xử lý tại từng màn hình qua useRequireAuth
// Sidebar state được lưu trong uiStore (Zustand) — persist across navigation
export default function StudentLayout() {
  const { isInitialized, isAuthenticated, user } = useAuthStore()
  const active = isInitialized && isAuthenticated && user?.role === 'STUDENT'
  const { state, refresh } = useStudentFaceEnrollment(active)
  const onEnrollmentPage = usePathname().endsWith('/face-enrollment')

  if (active && state === 'loading') return <ScreenState kind="loading" />
  if (active && state === 'error') {
    return <ScreenState kind="error" message="Không thể kiểm tra trạng thái đăng ký khuôn mặt." onRetry={() => void refresh()} />
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
