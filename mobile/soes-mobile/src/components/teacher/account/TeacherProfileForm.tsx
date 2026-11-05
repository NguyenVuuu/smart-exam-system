import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import type { User } from '../../../types/auth.types'
import { SectionCard } from '../../ui/SectionCard'

interface Props { user: User | null; email: string; phone: string; busy: boolean
  onEmail: (value: string) => void; onPhone: (value: string) => void; onSave: () => void }

export function TeacherProfileForm({ user, email, phone, busy, onEmail, onPhone, onSave }: Props) {
  return <SectionCard title="Thông tin cá nhân">
    <View style={styles.roleRow}><Text style={styles.roleBadge}>{user?.position === 'DEPARTMENT_HEAD' || user?.role === 'DEPARTMENT_HEAD' ? 'Trưởng bộ môn' : 'Giảng viên'}</Text></View>
    <View style={styles.field}><Text style={styles.label}>Họ và tên</Text><Text style={styles.value}>{user?.fullName ?? '—'}</Text></View>
    <View style={styles.field}><Text style={styles.label}>Mã giảng viên</Text><Text style={styles.value}>{user?.teacherCode ?? '—'}</Text></View>
    <View style={styles.field}><Text style={styles.label}>Email</Text><TextInput value={email} onChangeText={onEmail} autoCapitalize="none" keyboardType="email-address"
      placeholder="Email liên hệ" placeholderTextColor="#94a3b8" style={styles.input} /></View>
    <View style={styles.field}><Text style={styles.label}>Số điện thoại</Text><TextInput value={phone} onChangeText={onPhone} keyboardType="phone-pad"
      maxLength={20} placeholder="Số điện thoại" placeholderTextColor="#94a3b8" style={styles.input} /></View>
    <Pressable accessibilityRole="button" disabled={busy} onPress={onSave} style={styles.button}><Text style={styles.buttonText}>{busy ? 'Đang lưu...' : 'Lưu thông tin'}</Text></Pressable>
  </SectionCard>
}

const styles = StyleSheet.create({
  roleRow: { flexDirection: 'row', marginBottom: 4 }, roleBadge: { color: '#1d4ed8', backgroundColor: '#eff6ff', fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, overflow: 'hidden' },
  field: { marginTop: 12 }, label: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  value: { color: '#0f172a', fontSize: 14 }, input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a' },
  button: { minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { color: '#fff', fontWeight: '700' },
})
