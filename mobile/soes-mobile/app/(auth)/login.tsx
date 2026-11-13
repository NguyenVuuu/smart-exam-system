import { useRef, useState } from 'react'
import { X } from 'lucide-react-native'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewInstance,
} from 'react-native'
import { useLogin } from '../../src/hooks/useLogin'
import { SystemLogo } from '../../src/components/ui/SystemLogo'
import { scrollToFocusedInput } from '../../src/utils/keyboardScroll'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const { login, isLoading, error, clearError } = useLogin()
  const scrollRef = useRef<ScrollViewInstance>(null)
  const usernameRef = useRef<React.ElementRef<typeof TextInput>>(null)
  const passwordRef = useRef<React.ElementRef<typeof TextInput>>(null)
  const focusInput = (input: React.ElementRef<typeof TextInput> | null) => scrollToFocusedInput(scrollRef.current, { current: input }, 16)

  async function handleLogin() {
    if (!username.trim() || !password.trim()) return
    await login({ username: username.trim(), password })
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-white"
    >
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="flex-grow justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo & title */}
        <View className="items-center mb-10">
          <View className="mb-4"><SystemLogo size={80} /></View>
          <Text className="text-2xl font-bold text-slate-800">SOES</Text>
          <Text className="text-sm text-slate-500 mt-1">
            Hệ thống thi trực tuyến thông minh
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          {/* Error banner */}
          {error ? (
            <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center justify-between">
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
              <TouchableOpacity onPress={clearError} className="ml-2">
                <X size={18} color="#f87171" />
              </TouchableOpacity>
            </View>
          ) : null}

          {/* Username */}
          <View>
            <Text className="text-sm font-medium text-slate-700 mb-1.5">
              Mã tài khoản
            </Text>
            <TextInput
              ref={usernameRef}
              onFocus={() => focusInput(usernameRef.current)}
              className="border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 bg-slate-50 text-base"
              placeholder="Nhập mã tài khoản (vd: US000005)"
              placeholderTextColor="#94a3b8"
              value={username}
              onChangeText={(v) => { setUsername(v); clearError() }}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="default"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
          </View>

          {/* Password */}
          <View>
            <Text className="text-sm font-medium text-slate-700 mb-1.5">
              Mật khẩu
            </Text>
            <View className="flex-row items-center border border-slate-200 rounded-xl bg-slate-50">
              <TextInput
                ref={passwordRef}
                onFocus={() => focusInput(passwordRef.current)}
                className="flex-1 px-4 py-3.5 text-slate-800 text-base"
                placeholder="Nhập mật khẩu"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={(v) => { setPassword(v); clearError() }}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                className="px-4 py-3.5"
              >
                <Text className="text-slate-400 text-sm">
                  {showPassword ? 'Ẩn' : 'Hiện'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Submit button */}
          <TouchableOpacity
            onPress={handleLogin}
            disabled={isLoading || !username.trim() || !password.trim()}
            className={`rounded-xl py-4 items-center mt-2 ${
              isLoading || !username.trim() || !password.trim()
                ? 'bg-blue-300'
                : 'bg-blue-600'
            }`}
            activeOpacity={0.8}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Đăng nhập
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
