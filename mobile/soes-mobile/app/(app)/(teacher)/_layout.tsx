import { Redirect, Stack, useSegments } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { PortalLayout, PORTAL_BACKGROUND_COLOR } from '../../../src/components/layout/PortalLayout'
import { useTeacherNavigation } from '../../../src/hooks/useTeacherNavigation'
import { useAuthStore } from '../../../src/store/authStore'
import { ROLE_HOME } from '../../../src/utils/role'

export default function TeacherLayout() {
  const { isInitialized, isAuthenticated, user } = useAuthStore()
  const isTeacher = user?.role === 'TEACHER' || user?.role === 'DEPARTMENT_HEAD'
  const { groups, loading } = useTeacherNavigation(isInitialized && isAuthenticated && isTeacher)
  const segments = useSegments()
  const groupIndex = segments.findIndex((segment) => segment === '(teacher)')
  const activeRoute = groupIndex < 0 ? 'dashboard' : String(segments[groupIndex + 1] ?? 'dashboard')

  if (!isInitialized) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#2563eb" /></View>
  if (!isAuthenticated || !user) return <Redirect href="/(auth)/login" />
  if (!isTeacher) return <Redirect href={ROLE_HOME[user.role] as never} />
  if (loading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator color="#2563eb" /></View>

  return <PortalLayout groups={groups} activeRoute={activeRoute} portalLabel="Giảng viên"
    notificationsHref="/(app)/(teacher)/notifications">
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: PORTAL_BACKGROUND_COLOR } }} />
  </PortalLayout>
}
