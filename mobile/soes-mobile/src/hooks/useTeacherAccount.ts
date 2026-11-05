import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { changeTeacherPassword, getTeacherProfile, saveTeacherProfile } from '../api/teacher-account.api'
import { useAuthStore } from '../store/authStore'

export function useTeacherAccount() {
  const user = useAuthStore((state) => state.user)
  const setUser = useAuthStore((state) => state.setUser)
  const [email, setEmail] = useState(user?.email ?? '')
  const [phone, setPhone] = useState(user?.phoneNumber ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let active = true
    getTeacherProfile().then((profile) => {
      if (!active) return
      setUser(profile); setEmail(profile.email ?? ''); setPhone(profile.phoneNumber ?? '')
    }).catch(() => { /* Keep the authenticated profile available offline. */ })
    return () => { active = false }
  }, [setUser])

  async function saveProfile() {
    if (busy) return
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return Alert.alert('Email chưa hợp lệ')
    setBusy(true)
    try {
      setUser(await saveTeacherProfile(email, phone))
      Alert.alert('Đã cập nhật', 'Thông tin liên hệ đã được lưu.')
    } catch { Alert.alert('Không thể lưu', 'Kiểm tra email hoặc thử lại sau.') }
    finally { setBusy(false) }
  }

  async function changePassword() {
    if (busy) return
    if (!currentPassword || newPassword.length < 6 || newPassword.length > 100 || newPassword !== confirmPassword) {
      Alert.alert('Mật khẩu chưa hợp lệ', 'Nhập mật khẩu hiện tại, mật khẩu mới từ 6 đến 100 ký tự và xác nhận trùng khớp.'); return
    }
    setBusy(true)
    try {
      await changeTeacherPassword(currentPassword, newPassword)
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      Alert.alert('Đã đổi mật khẩu')
    } catch { Alert.alert('Không thể đổi mật khẩu', 'Kiểm tra mật khẩu hiện tại và thử lại.') }
    finally { setBusy(false) }
  }

  return { user, email, setEmail, phone, setPhone, currentPassword, setCurrentPassword,
    newPassword, setNewPassword, confirmPassword, setConfirmPassword, busy, saveProfile, changePassword }
}
