import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Platform, Animated,
} from 'react-native'
import { useRequireAuth } from '../../../src/hooks/useRequireAuth'
import { useStudentAccount } from '../../../src/hooks/useStudentAccount'
import { useKeyboardBottomOffset } from '../../../src/hooks/useKeyboardBottomOffset'
import StudentLayout from '../../../src/components/student/StudentLayout'
import { useState } from 'react'

// ── Avatar initials ───────────────────────────────────────────────────────────
function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Input field component ─────────────────────────────────────────────────────
function InputField({
  label, value, onChangeText, placeholder, keyboardType, secureTextEntry, editable = true, icon,
}: {
  label: string
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  keyboardType?: 'default' | 'email-address' | 'phone-pad'
  secureTextEntry?: boolean
  editable?: boolean
  icon: string
}) {
  const [showPass, setShowPass] = useState(false)
  const [focused, setFocused] = useState(false)
  const isPass = secureTextEntry === true

  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
        {label}
      </Text>
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        backgroundColor: editable ? '#fff' : '#f8fafc',
        borderRadius: 12, borderWidth: 1.5,
        borderColor: focused ? '#2563eb' : '#e2e8f0',
        paddingHorizontal: 12, height: 48,
      }}>
        <Text style={{ fontSize: 16, marginRight: 8, opacity: 0.6 }}>{icon}</Text>
        <TextInput
          style={{ flex: 1, fontSize: 14, color: editable ? '#0f172a' : '#94a3b8' }}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#cbd5e1"
          keyboardType={keyboardType ?? 'default'}
          secureTextEntry={isPass && !showPass}
          editable={editable}
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {isPass && (
          <TouchableOpacity onPress={() => setShowPass(p => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={{ fontSize: 14, color: '#94a3b8' }}>{showPass ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

// ── Section card ──────────────────────────────────────────────────────────────
function SectionCard({ title, subtitle, icon, children }: {
  title: string; subtitle?: string; icon: string; children: React.ReactNode
}) {
  return (
    <View style={{
      backgroundColor: '#fff', borderRadius: 18, padding: 20, marginBottom: 14,
      shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 3 },
      borderWidth: 1, borderColor: '#f1f5f9',
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 18 }}>{icon}</Text>
        </View>
        <View>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{title}</Text>
          {subtitle && <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 1 }}>{subtitle}</Text>}
        </View>
      </View>
      {children}
    </View>
  )
}

// ── Save button ───────────────────────────────────────────────────────────────
function SaveButton({ label, onPress, busy }: { label: string; onPress: () => void; busy: boolean }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={busy}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
        paddingVertical: 13, borderRadius: 12,
        backgroundColor: busy ? '#93c5fd' : '#2563eb',
        marginTop: 4,
      }}
    >
      {busy
        ? <ActivityIndicator size="small" color="#fff" />
        : <Text style={{ fontSize: 15 }}>💾</Text>
      }
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
        {busy ? 'Đang lưu...' : label}
      </Text>
    </TouchableOpacity>
  )
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function StudentAccountScreen() {
  const { isInitialized, isAuthenticated } = useRequireAuth()
  const {
    user, email, setEmail, phone, setPhone,
    currentPassword, setCurrentPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    busy, loadError,
    saveProfile, changePassword, handleLogout,
  } = useStudentAccount()

  const { animatedOffset, isKeyboardOpen } = useKeyboardBottomOffset({ accountForBottomInset: true })

  if (!isInitialized || !isAuthenticated) return null

  const initials = user?.fullName ? getInitials(user.fullName) : '?'
  const studentCode = user?.studentCode ?? '—'

  return (
    <StudentLayout activeRoute="account">
      <Animated.View style={{ flex: 1, paddingBottom: Platform.OS === 'ios' ? animatedOffset : 0 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 20, paddingBottom: isKeyboardOpen ? 220 : 48 }}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={false}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Hero avatar ───────────────────────────────────────────── */}
          <View style={{ alignItems: 'center', marginBottom: 24 }}>
            <View style={{
              width: 88, height: 88, borderRadius: 28, backgroundColor: '#2563eb',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
              shadowColor: '#2563eb', shadowOpacity: 0.35, shadowRadius: 16, shadowOffset: { width: 0, height: 6 },
            }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#fff' }}>{initials}</Text>
            </View>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>
              {user?.fullName ?? '—'}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#eff6ff', borderRadius: 20, borderWidth: 1, borderColor: '#bfdbfe' }}>
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#1d4ed8' }}>🎓 Sinh viên</Text>
              </View>
              <View style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: '#f8fafc', borderRadius: 20, borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 12, color: '#475569', fontWeight: '600' }}>{studentCode}</Text>
              </View>
            </View>
          </View>

          {/* ── Load error ────────────────────────────────────────────── */}
          {loadError && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fef2f2', borderRadius: 12, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: '#fecaca' }}>
              <Text style={{ fontSize: 14 }}>⚠️</Text>
              <Text style={{ fontSize: 12, color: '#dc2626', flex: 1 }}>
                Không thể tải thông tin mới nhất. Đang hiển thị dữ liệu đã lưu.
              </Text>
            </View>
          )}

          {/* ── Readonly info ──────────────────────────────────────────── */}
          <SectionCard title="Thông tin tài khoản" subtitle="Thông tin hệ thống, không thể thay đổi" icon="🪪">
            <InputField label="Họ và tên" value={user?.fullName ?? ''} onChangeText={() => {}} icon="👤" editable={false} />
            <InputField label="Mã sinh viên" value={studentCode} onChangeText={() => {}} icon="🎓" editable={false} />
          </SectionCard>

          {/* ── Contact info ───────────────────────────────────────────── */}
          <SectionCard title="Thông tin liên hệ" subtitle="Cập nhật email và số điện thoại" icon="📋">
            <InputField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="vd: sinhvien@email.com"
              keyboardType="email-address"
              icon="✉️"
            />
            <InputField
              label="Số điện thoại"
              value={phone}
              onChangeText={setPhone}
              placeholder="vd: 0901234567"
              keyboardType="phone-pad"
              icon="📱"
            />
            <SaveButton label="Lưu thông tin liên hệ" onPress={() => void saveProfile()} busy={busy} />
          </SectionCard>

          {/* ── Change password ────────────────────────────────────────── */}
          <SectionCard title="Đổi mật khẩu" subtitle="Bảo mật tài khoản của bạn" icon="🔐">
            <InputField
              label="Mật khẩu hiện tại"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              placeholder="Nhập mật khẩu hiện tại"
              secureTextEntry
              icon="🔑"
            />
            <InputField
              label="Mật khẩu mới"
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Tối thiểu 6 ký tự"
              secureTextEntry
              icon="🔒"
            />
            <InputField
              label="Xác nhận mật khẩu mới"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Nhập lại mật khẩu mới"
              secureTextEntry
              icon="🔒"
            />
            {/* Password strength hint */}
            {newPassword.length > 0 && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12, marginTop: -6 }}>
                {[...Array(3)].map((_, i) => {
                  const strength = newPassword.length >= 10 ? 3 : newPassword.length >= 7 ? 2 : 1
                  return (
                    <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i < strength ? (strength === 1 ? '#ef4444' : strength === 2 ? '#f59e0b' : '#22c55e') : '#e2e8f0' }} />
                  )
                })}
                <Text style={{ fontSize: 10, color: '#94a3b8', marginLeft: 4 }}>
                  {newPassword.length >= 10 ? 'Mạnh' : newPassword.length >= 7 ? 'Trung bình' : 'Yếu'}
                </Text>
              </View>
            )}
            <SaveButton label="Đổi mật khẩu" onPress={() => void changePassword()} busy={busy} />
          </SectionCard>

          {/* ── Logout ────────────────────────────────────────────────── */}
          <TouchableOpacity
            onPress={() => void handleLogout()}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
              paddingVertical: 14, borderRadius: 14,
              backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#fecaca',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 16 }}>🚪</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#dc2626' }}>Đăng xuất</Text>
          </TouchableOpacity>

        </ScrollView>
      </Animated.View>
    </StudentLayout>
  )
}
