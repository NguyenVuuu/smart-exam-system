import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { ArrowLeft, ChevronRight, ClipboardList, GraduationCap, Landmark, Settings, UserRound, UsersRound, type LucideIcon } from 'lucide-react-native'
import { router } from 'expo-router'
import { useSelectRole } from '../../src/hooks/useLogin'
import { ROLE_LABEL } from '../../src/utils/role'
import type { UserRole } from '../../src/types/auth.types'

const ROLE_ICON: Record<UserRole, LucideIcon> = {
  STUDENT: GraduationCap,
  TEACHER: UsersRound,
  DEPARTMENT_HEAD: Landmark,
  ADMIN: Settings,
  EDUCATION_OFFICER: ClipboardList,
}

export default function SelectRoleScreen() {
  const { selectRole, isLoading, error, pendingRoleSelection } = useSelectRole()

  // Nếu không có pending data thì render null — useSelectRole tự handle redirect
  if (!pendingRoleSelection) return null

  const { user, availableRoles } = pendingRoleSelection

  return (
    <View className="flex-1 bg-white px-6 justify-center">
      {/* Header */}
      <View className="items-center mb-8">
        <View className="w-16 h-16 bg-blue-100 rounded-full items-center justify-center mb-3">
          <UserRound size={27} color="#2563eb" />
        </View>
        <Text className="text-xl font-bold text-slate-800">Chọn vai trò</Text>
        <Text className="text-sm text-slate-500 mt-1">
          Xin chào, {user.fullName}
        </Text>
        <Text className="text-xs text-slate-400 mt-0.5">
          Tài khoản của bạn có nhiều vai trò. Vui lòng chọn vai trò để tiếp tục.
        </Text>
      </View>

      {/* Error */}
      {error ? (
        <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
          <Text className="text-red-600 text-sm text-center">{error}</Text>
        </View>
      ) : null}

      {/* Role list */}
      <View className="gap-3">
        {availableRoles.map((item) => {
          const RoleIcon = ROLE_ICON[item.role]
          return (
            <TouchableOpacity
              key={item.role}
              onPress={() => selectRole(item.role)}
              disabled={isLoading}
              className="flex-row items-center border border-slate-200 rounded-2xl px-5 py-4 bg-slate-50 active:bg-blue-50 active:border-blue-300"
              activeOpacity={0.75}
            >
              <View className="mr-4"><RoleIcon size={25} color="#2563eb" /></View>
              <View className="flex-1">
                <Text className="font-semibold text-slate-800">
                  {ROLE_LABEL[item.role]}
                </Text>
                <Text className="text-xs text-slate-500 mt-0.5">
                  {item.code}
                  {item.position ? ` • ${item.position}` : ''}
                </Text>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color="#2563eb" />
              ) : (
                <ChevronRight size={18} color="#94a3b8" />
              )}
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Back to login */}
      <TouchableOpacity
        onPress={() => router.replace('/(auth)/login')}
        className="mt-8 items-center"
        disabled={isLoading}
      >
        <View className="flex-row items-center gap-1.5"><ArrowLeft size={15} color="#94a3b8" /><Text className="text-slate-400 text-sm">Quay lại đăng nhập</Text></View>
      </TouchableOpacity>
    </View>
  )
}
