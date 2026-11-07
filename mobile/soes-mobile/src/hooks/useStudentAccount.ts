import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { getStudentProfile, saveStudentProfile, changeStudentPassword } from '../api/student-account.api'
import { useAuthStore } from '../store/authStore'
import { apiClient } from '../api/client'
import { router } from 'expo-router'

export function useStudentAccount() {
  const user = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)
  const logout = useAuthStore((s) => s.logout)

  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phoneNumber ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [loadError, setLoadError] = useState(false)

  useEffect(() => {
    let active = true
    setLoadError(false)
    getStudentProfile()
      .then((profile) => {
        if (!active) return
        setUser(profile)
        setEmail(profile.email ?? '')
        setPhone(profile.phoneNumber ?? '')
      })
      .catch(() => {
        if (active) setLoadError(true)
      })
    return () => { active = false }
  }, [setUser])

  async function saveProfile() {
    if (busy) return
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Email không hợp lệ', 'Vui lòng nhập đúng định dạng email.')
      return
    }
    setBusy(true)
    try {
      const updated = await saveStudentProfile(email, phone)
      setUser(updated)
      Alert.alert('✅ Đã lưu', 'Thông tin liên hệ đã được cập nhật.')
    } catch {
      Alert.alert('Không thể lưu', 'Kiểm tra kết nối hoặc thử lại sau.')
    } finally {
      setBusy(false)
    }
  }

  async function changePassword() {
    if (busy) return
    if (!currentPassword) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập mật khẩu hiện tại.')
      return
    }
    if (newPassword.length < 6 || newPassword.length > 100) {
      Alert.alert('Mật khẩu không hợp lệ', 'Mật khẩu mới phải từ 6 đến 100 ký tự.')
      return
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Không khớp', 'Mật khẩu xác nhận không trùng với mật khẩu mới.')
      return
    }
    setBusy(true)
    try {
      await changeStudentPassword(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      Alert.alert('✅ Đã đổi mật khẩu', 'Mật khẩu mới đã được áp dụng.')
    } catch {
      Alert.alert('Không thể đổi mật khẩu', 'Kiểm tra mật khẩu hiện tại và thử lại.')
    } finally {
      setBusy(false)
    }
  }

  function handleLogout() {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất', style: 'destructive',
        onPress: () => {
          void (async () => {
            try { await apiClient.post('/auth/logout') } catch { /* ignore */ }
            await logout()
            router.replace('/(auth)/login')
          })()
        },
      },
    ])
  }

  return {
    user, email, setEmail, phone, setPhone,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    busy, loadError,
    saveProfile, changePassword, handleLogout,
  }
}
