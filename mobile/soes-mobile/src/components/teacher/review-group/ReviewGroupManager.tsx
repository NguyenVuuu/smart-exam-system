import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import * as api from '../../../api/teacher-review-group.api'
import { SectionCard } from '../../ui/SectionCard'
import type { ReviewGroup, ReviewGroupCandidate } from '../../../types/teacher-review-group.types'
import { useAuthStore } from '../../../store/authStore'

interface Props { group: ReviewGroup | null; candidates: ReviewGroupCandidate[]; onChanged: () => Promise<void> }

export function ReviewGroupManager({ group, candidates, onChanged }: Props) {
  const [name, setName] = useState(group?.name ?? '')
  const [busy, setBusy] = useState(false)
  async function change(action: () => Promise<unknown>) {
    if (busy) return
    setBusy(true)
    try { await action(); await onChanged() }
    catch { Alert.alert('Không thể cập nhật', 'Dữ liệu hoặc quyền quản lý đã thay đổi. Vui lòng thử lại.') }
    finally { setBusy(false) }
  }
  function confirm(message: string, action: () => Promise<unknown>) {
    Alert.alert('Xác nhận', message, [{ text: 'Hủy', style: 'cancel' }, { text: 'Đồng ý', onPress: () => { void change(action) } }])
  }
  const available = candidates.filter((candidate) => !group?.members.some((member) => member.teacherId === candidate.id))
  return <>
    <SectionCard title={group ? 'Quản lý nhóm' : 'Tạo nhóm duyệt đề'}>
      <Text style={styles.label}>Tên nhóm</Text>
      <TextInput value={name} onChangeText={setName} placeholder="Tên nhóm duyệt đề" placeholderTextColor="#94a3b8"
        maxLength={150} style={styles.input} />
      <Pressable accessibilityRole="button" disabled={busy || !name.trim() || name.trim() === group?.name}
        onPress={() => void change(() => group ? api.renameReviewGroup(name.trim()) : api.createReviewGroup(name.trim()))}
        style={[styles.button, styles.primary]}><Text style={styles.primaryText}>{group ? 'Lưu tên nhóm' : 'Tạo nhóm'}</Text></Pressable>
      {group && <Pressable accessibilityRole="button" disabled={busy}
        onPress={() => confirm(group.status === 'ACTIVE' ? 'Ngừng hoạt động nhóm duyệt đề?' : 'Kích hoạt nhóm duyệt đề?',
          () => api.setReviewGroupStatus(group.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'))}
        style={[styles.button, styles.secondary]}><Text style={styles.secondaryText}>{group.status === 'ACTIVE' ? 'Ngừng nhóm' : 'Kích hoạt nhóm'}</Text></Pressable>}
    </SectionCard>
    {group && <SectionCard title="Thêm giảng viên cùng bộ môn">
      {available.length ? available.map((candidate) => <View key={candidate.id} style={styles.row}>
        <Text style={styles.member}>{candidate.user.fullName} ({candidate.teacherCode})</Text>
        <Pressable accessibilityRole="button" disabled={busy} onPress={() => void change(() => api.addReviewGroupMember(candidate.id))}
          style={styles.smallButton}><Text style={styles.link}>Thêm</Text></Pressable>
      </View>) : <Text style={styles.muted}>Tất cả giảng viên đủ điều kiện đã ở trong nhóm.</Text>}
    </SectionCard>}
  </>
}

export function ReviewGroupMembers({ group, onChanged }: { group: ReviewGroup; onChanged: () => Promise<void> }) {
  const [busy, setBusy] = useState(false)
  const actorId = useAuthStore((state) => state.user?.profileId)
  return <SectionCard title={`Thành viên (${group.members.length})`}>
    {group.members.map((member) => <View key={member.teacherId} style={styles.row}>
      <Text style={styles.member}>{member.teacher.user.fullName} ({member.teacher.teacherCode})</Text>
      {group.canManage && member.teacherId !== actorId ?
        <Pressable accessibilityRole="button" disabled={busy} style={styles.smallButton} onPress={() => Alert.alert('Xóa thành viên',
          `Loại ${member.teacher.user.fullName} khỏi nhóm?`, [{ text: 'Hủy', style: 'cancel' }, { text: 'Loại', style: 'destructive', onPress: () => {
            setBusy(true)
            void api.removeReviewGroupMember(member.teacherId).then(onChanged)
              .catch(() => Alert.alert('Không thể xóa', 'Không thể loại thành viên này khỏi nhóm.'))
              .finally(() => setBusy(false))
          } }])}><Text style={styles.remove}>Loại</Text></Pressable> : null}
    </View>)}
  </SectionCard>
}

const styles = StyleSheet.create({
  label: { color: '#334155', fontWeight: '700', marginBottom: 8 },
  input: { minHeight: 46, borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 10, paddingHorizontal: 12, color: '#0f172a' },
  button: { minHeight: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  primary: { backgroundColor: '#2563eb' }, secondary: { backgroundColor: '#f1f5f9' },
  primaryText: { color: '#fff', fontWeight: '700' }, secondaryText: { color: '#475569', fontWeight: '700' },
  row: { minHeight: 50, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  member: { flex: 1, minWidth: 0, color: '#334155', fontSize: 13 }, smallButton: { minWidth: 48, minHeight: 44, justifyContent: 'center', alignItems: 'center' },
  link: { color: '#2563eb', fontWeight: '700' }, remove: { color: '#be123c', fontWeight: '700' }, muted: { color: '#64748b', fontSize: 13 },
})
