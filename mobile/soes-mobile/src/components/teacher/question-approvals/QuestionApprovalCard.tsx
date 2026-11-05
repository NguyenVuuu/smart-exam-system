import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { QuestionCard } from '../question-bank/QuestionCard'
import type { QuestionApproval } from '../../../types/teacher-question-approvals.types'

interface Props { item: QuestionApproval; busy: boolean; reason: string; editingReason: boolean
  onApprove: () => void; onBeginReject: () => void; onReasonChange: (value: string) => void; onReject: () => void }

export function QuestionApprovalCard({ item, busy, reason, editingReason, onApprove, onBeginReject, onReasonChange, onReject }: Props) {
  return <View style={styles.root}>
    <QuestionCard question={item.question} />
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onBeginReject} style={[styles.button, styles.reject]}>
        <Text style={styles.rejectText}>Yêu cầu sửa</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={onApprove} style={[styles.button, styles.approve]}>
        <Text style={styles.approveText}>Duyệt câu hỏi</Text></Pressable>
    </View>
    {editingReason && <View style={styles.reason}>
      <Text style={styles.label}>Nội dung cần sửa</Text>
      <TextInput value={reason} onChangeText={onReasonChange} multiline maxLength={1000} textAlignVertical="top"
        placeholder="Nêu lý do cụ thể để tác giả chỉnh sửa" placeholderTextColor="#94a3b8" style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || reason.trim().length < 5} onPress={onReject} style={[styles.button, styles.reject]}>
        <Text style={styles.rejectText}>Gửi yêu cầu sửa</Text></Pressable>
    </View>}
  </View>
}

const styles = StyleSheet.create({
  root: { marginBottom: 14 }, actions: { flexDirection: 'row', gap: 8 }, button: { flex: 1, minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  reject: { backgroundColor: '#fff1f2' }, approve: { backgroundColor: '#059669' }, rejectText: { color: '#be123c', fontWeight: '700' }, approveText: { color: '#fff', fontWeight: '700' },
  reason: { marginTop: 8, padding: 12, backgroundColor: '#fff', borderRadius: 12 }, label: { color: '#334155', fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 80, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, padding: 10, color: '#0f172a', marginBottom: 10 },
})
