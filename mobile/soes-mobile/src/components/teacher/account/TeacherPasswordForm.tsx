import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SectionCard } from '../../ui/SectionCard'

interface Props { current: string; next: string; confirm: string; busy: boolean
  onCurrent: (value: string) => void; onNext: (value: string) => void; onConfirm: (value: string) => void; onSave: () => void }

export function TeacherPasswordForm({ current, next, confirm, busy, onCurrent, onNext, onConfirm, onSave }: Props) {
  return <SectionCard title="Đổi mật khẩu">
    <Field label="Mật khẩu hiện tại" value={current} onChange={onCurrent} />
    <Field label="Mật khẩu mới" value={next} onChange={onNext} />
    <Field label="Xác nhận mật khẩu mới" value={confirm} onChange={onConfirm} />
    <Pressable accessibilityRole="button" disabled={busy} onPress={onSave} style={styles.button}>
      <Text style={styles.buttonText}>{busy ? 'Đang xử lý...' : 'Đổi mật khẩu'}</Text></Pressable>
  </SectionCard>
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>
    <TextInput value={value} onChangeText={onChange} secureTextEntry autoCapitalize="none" autoCorrect={false}
      textContentType="password" style={styles.input} /></View>
}

const styles = StyleSheet.create({
  field: { marginTop: 12 }, label: { color: '#475569', fontSize: 12, fontWeight: '700', marginBottom: 5 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a' },
  button: { minHeight: 46, borderRadius: 10, backgroundColor: '#2563eb', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  buttonText: { color: '#fff', fontWeight: '700' },
})
