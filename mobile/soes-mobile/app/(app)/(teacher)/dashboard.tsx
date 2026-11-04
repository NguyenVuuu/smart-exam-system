import { View, Text, TouchableOpacity } from 'react-native'
import { useAuthStore } from '../../../src/store/authStore'
import { useLogout } from '../../../src/hooks/useLogout'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { ROLE_LABEL } from '../../../src/utils/role'

export default function TeacherDashboard() {
  const { user } = useAuthStore()
  const { handleLogout, isLoading } = useLogout()
  const { isInitialized, isAuthenticated } = useRequireAuth()

  if (!isInitialized || !isAuthenticated) return null

  return (
    <View className="flex-1 bg-slate-50 px-6 pt-16">
      <View className="flex-row items-center justify-between mb-8">
        <View>
          <Text className="text-xs text-slate-500">Xin chào,</Text>
          <Text className="text-xl font-bold text-slate-800">{user?.fullName}</Text>
          <Text className="text-xs text-blue-600 mt-0.5">
            {user?.role ? ROLE_LABEL[user.role] : ''} • {user?.teacherCode}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleLogout}
          disabled={isLoading}
          className="bg-red-50 border border-red-200 rounded-xl px-4 py-2"
        >
          <Text className="text-red-500 text-sm font-medium">Đăng xuất</Text>
        </TouchableOpacity>
      </View>

      <View className="bg-white rounded-2xl p-6 shadow-sm">
        <Text className="text-base font-semibold text-slate-700 mb-1">
          Dashboard giảng viên
        </Text>
        <Text className="text-sm text-slate-500">
          Chức năng đang được phát triển...
        </Text>
      </View>
    </View>
  )
}
