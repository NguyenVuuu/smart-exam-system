import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuthStore } from '../src/store/authStore'

export default function Index() {
  const { isInitialized, isAuthenticated, user, pendingRoleSelection } = useAuthStore()

  // Chờ useInitAuth chạy xong
  if (!isInitialized) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    )
  }

  if (pendingRoleSelection) {
    return <Redirect href="/(auth)/select-role" />
  }

  if (isAuthenticated && user) {
    // Redirect theo role
    const roleHome: Record<string, string> = {
      STUDENT: '/(app)/(student)/dashboard',
      TEACHER: '/(app)/(teacher)/dashboard',
      DEPARTMENT_HEAD: '/(app)/(teacher)/dashboard',
      ADMIN: '/(app)/(admin)/dashboard',
      EDUCATION_OFFICER: '/(app)/(admin)/dashboard',
    }
    return <Redirect href={(roleHome[user.role] ?? '/(app)/(student)/dashboard') as never} />
  }

  return <Redirect href="/(auth)/login" />
}
